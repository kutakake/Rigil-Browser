use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Serialize, Deserialize)]
struct TabData {
    tabs: String,
    current_tab_number: i32,
    current_page_number: i32,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, save_tabs, read_tabs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

extern crate reqwest;

// URLを正規化する関数
fn normalize_url(name: &str) -> String {
    if name.is_empty() {
        return String::new();
    }
    
    let mut namestring = name.to_string();
    let name_length = namestring.len();
    let check_length = if name_length >= 8 { 8 } else { name_length };
    let first_part: String = namestring.chars().take(check_length).collect();
    
    if !first_part.contains("http://") && !first_part.contains("https://") {
        namestring = format!("https://{}", namestring);
    }
    
    namestring
}

// ベースURLを取得する関数
fn get_base_url(url: &str) -> String {
    let url_chars: Vec<char> = url.chars().collect();
    let mut base_url = String::new();
    let mut slash_count = 0;
    
    for (i, &ch) in url_chars.iter().enumerate() {
        base_url.push(ch);
        if ch == '/' {
            slash_count += 1;
            if slash_count == 3 {
                break;
            }
        }
    }
    
    // パス部分の処理
    if slash_count == 3 && url.len() > base_url.len() {
        let remaining_path = &url[base_url.len()..];
        if let Some(last_slash_pos) = remaining_path.rfind('/') {
            base_url.push_str(&remaining_path[..=last_slash_pos]);
        }
    }
    
    base_url
}

// 相対URLを絶対URLに変換する関数
fn resolve_relative_url(href: &str, base_url: &str, current_url: &str) -> String {
    if href.contains("http") {
        return href.to_string();
    }
    
    if href.starts_with('/') {
        // 絶対パス（ルートからの相対パス）
        let mut domain_only = String::new();
        let mut slash_count = 0;
        for ch in current_url.chars() {
            domain_only.push(ch);
            if ch == '/' {
                slash_count += 1;
                if slash_count == 3 {
                    domain_only.pop();
                    break;
                }
            }
        }
        format!("{}{}", domain_only, href)
    } else {
        // 相対パス
        if base_url.ends_with('/') {
            format!("{}{}", base_url, href)
        } else {
            format!("{}/{}", base_url, href)
        }
    }
}

// hrefを抽出する関数
fn extract_href(tag: &str) -> String {
    let tag_chars: Vec<char> = tag.chars().collect();
    let mut href = String::new();
    let mut i = 1;
    
    while i < tag_chars.len() {
        if tag_chars[i] == '"' {
            i += 1;
            while i < tag_chars.len() && tag_chars[i] != '"' {
                href.push(tag_chars[i]);
                i += 1;
            }
            break;
        }
        i += 1;
    }
    
    href
}

// リンクタグを処理する関数
fn process_link_tag(tag: &str, contents: &[char], i: &mut usize, base_url: &str, current_url: &str) -> String {
    let href = extract_href(tag);
    let resolved_href = resolve_relative_url(&href, base_url, current_url);
    
    // リンクテキストを取得
    let mut full_tag = tag.to_string();
    if *i < contents.len() && contents[*i] != '<' {
        while *i < contents.len() && contents[*i] != '<' {
            full_tag.push(contents[*i]);
            *i += 1;
        }
        if *i < contents.len() {
            while *i < contents.len() && contents[*i] != '>' {
                full_tag.push(contents[*i]);
                *i += 1;
            }
            if *i < contents.len() {
                full_tag.push(contents[*i]);
            }
        }
    }
    
    if full_tag.contains("</a>") {
        let link_text = extract_link_text(&full_tag);
        format!(
            "<button id=\"hreftag\" onclick=\"javascript:{{document.getElementById('greet-input').value='{}';window.globalFunction.greet()}}\">{}</button>",
            resolved_href, link_text
        )
    } else {
        String::new()
    }
}

// リンクテキストを抽出する関数
fn extract_link_text(full_tag: &str) -> String {
    let tag_chars: Vec<char> = full_tag.chars().collect();
    let mut text = String::new();
    let mut in_content = false;
    let mut i = 0;
    
    while i < tag_chars.len() {
        if !in_content && tag_chars[i] == '>' {
            in_content = true;
            i += 1;
            continue;
        }
        
        if in_content {
            if i + 3 < tag_chars.len() && 
               tag_chars[i] == '<' && tag_chars[i+1] == '/' && 
               tag_chars[i+2] == 'a' && tag_chars[i+3] == '>' {
                break;
            }
            text.push(tag_chars[i]);
        }
        i += 1;
    }
    
    text
}

// スクリプトタグをスキップする関数
fn skip_script_tag(contents: &[char], i: &mut usize) {
    let mut tag = String::new();
    while *i < contents.len() {
        tag.push(contents[*i]);
        if contents[*i] == '>' && tag.contains("</script>") {
            break;
        }
        *i += 1;
    }
}

// スタイルタグをスキップする関数
fn skip_style_tag(contents: &[char], i: &mut usize) {
    let mut tag = String::new();
    while *i < contents.len() {
        tag.push(contents[*i]);
        if contents[*i] == '>' && tag.contains("</style>") {
            break;
        }
        *i += 1;
    }
}

// HTMLを解析してテキストに変換する関数
fn parse_html_to_text(html: &str, base_url: &str, current_url: &str) -> String {
    let contents: Vec<char> = html.chars().collect();
    let mut formatted_text = "<script type=\"module\" src=\"/main.js\" defer></script>".to_string();
    let mut i = 0;
    
    while i < contents.len() {
        if contents[i] == '<' {
            let mut tag = String::new();
            
            // タグを読み取り
            while i < contents.len() {
                tag.push(contents[i]);
                i += 1;
                if i < contents.len() && contents[i] == '>' {
                    tag.push(contents[i]);
                    i += 1;
                    break;
                }
            }
            
            // タグの種類に応じて処理
            if tag.contains("<a href") {
                let link_html = process_link_tag(&tag, &contents, &mut i, base_url, current_url);
                formatted_text.push_str(&link_html);
            } else if tag.contains("<script") {
                skip_script_tag(&contents, &mut i);
            } else if tag.contains("<style") {
                skip_style_tag(&contents, &mut i);
            } else {
                formatted_text.push_str(&is_formatted(tag));
            }
            
            if i < contents.len() && contents[i] == '<' {
                continue;
            }
        }
        
        if i < contents.len() {
            if contents[i] == '>' {
                i += 1;
                continue;
            }
            formatted_text.push(contents[i]);
            i += 1;
        }
    }
    
    formatted_text
}

#[tauri::command]
fn greet(name: &str) -> String {
    if name.is_empty() {
        return String::new();
    }
    
    if name.contains("rigil:newtab") {
        return "<title>New tab</title>New tab".to_string();
    }
    
    let normalized_url = normalize_url(name);
    let base_url = get_base_url(&normalized_url);
    let html_body = gethtml(&normalized_url);
    
    parse_html_to_text(&html_body, &base_url, &normalized_url)
}

fn gethtml(url: &str) -> String {
    let client = reqwest::blocking::Client::new();
    let mut query = vec![];
    let url_length = url.len();
    let url_vec: Vec<char> = url.chars().collect();
    //let mut queries: String = Default::default();
    if url.contains("?") {
        //クエリパラメータを取得
        let mut i: usize = 0;
        loop {
            if url_vec[i] == '?' {
                i += 1;
                let mut key: String = String::from("");
                let mut value: String = String::from("");
                loop {
                    if url_vec[i] == '=' {
                        i += 1;
                        loop {
                            if i >= url_length {
                                break;
                            }
                            if url_vec[i] == '&' {
                                query.push((key.clone(), value.clone()));
                                key = String::from("");
                                value = String::from("");
                                break;
                                //push!(query, (&key, &value));
                            }
                            if url_vec[i] != '/' {
                                value = format!("{}{}", value, url_vec[i]);
                            }
                            i += 1;
                        }
                    }
                    if i >= url_length {
                        query.push((key.clone(), value.clone()));
                        break;
                    }
                    if url_vec[i] != '&' {
                        key = format!("{}{}", key, url_vec[i]);
                    }
                    i += 1;
                }
            }
            if i >= url_length {
                break;
            }
            i += 1;
        }
    }
    let mut url_without_query = String::from("");
    let mut i = 0;
    while i < url_length && url_vec[i] != '?' {
        url_without_query = format!("{}{}", url_without_query, url_vec[i]);
        i += 1;
    }
    match client.get(url_without_query).query(&query).send() {
        Ok(html) => return html.text().unwrap(),

        Err(e) => {
            println!("{}", e);
            return format!(
                "{}{}",
                "Oops! Something went wrong. The entered url is: ", url
            );
        }
    };
}

fn is_formatted(tag: String) -> String {
    //title, br, h, b, i, ul, li, ol
    let tags: Vec<&str> = vec![
        "<title", "</title", "<br", "<br /", "<h1", "</h1", "<h2", "</h2", "<h3", "</h3", "<h4",
        "</h4", "<h5", "</h5", "<h6", "</h6", "<b>", "</b>", "<i>", "</i>", "<li>", "<li ",
        "</li>", "<ul", "</ul", "<ol", "<ol ", "</ol",
    ];
    let length_tags: usize = tags.len();
    for i in 0..length_tags - 1 {
        if tag.contains(tags[i]) {
            let output: String = tags[i].to_string();
            let vec_output: Vec<char> = output.chars().collect();
            let length_output: usize = output.len();
            if vec_output[length_output - 1] == '>' {
                return output;
            } else {
                return format!("{}{}", output, ">");
            }
        }
    }
    String::from("")
}

#[tauri::command]
async fn save_tabs(app: tauri::AppHandle, tabs: String, current_tab_number: i32, current_page_number: i32) -> Result<String, String> {
    let tab_data = TabData {
        tabs,
        current_tab_number,
        current_page_number,
    };
    
    let json_data = serde_json::to_string(&tab_data).map_err(|e| e.to_string())?;
    
    // アプリデータディレクトリのパスを取得（WindowsとAndroidの両方に対応）
    let app_data_dir = app.path().app_data_dir()
        .or_else(|_| app.path().app_local_data_dir())
        .map_err(|e| format!("アプリデータディレクトリの取得に失敗: {}", e))?;
    let rigil_dir = app_data_dir.join("rigil");
    let tabs_file = rigil_dir.join("tabs.json");
    
    // ディレクトリが存在しない場合は作成
    if !rigil_dir.exists() {
        std::fs::create_dir_all(&rigil_dir).map_err(|e| format!("ディレクトリ作成エラー: {}", e))?;
    }
    
    // ファイルに書き込み
    std::fs::write(&tabs_file, &json_data).map_err(|e| format!("ファイル書き込みエラー: {}", e))?;
    
    Ok("保存完了".to_string())
}

#[tauri::command]
async fn read_tabs(app: tauri::AppHandle) -> Result<String, String> {
    // アプリデータディレクトリのパスを取得（WindowsとAndroidの両方に対応）
    let app_data_dir = app.path().app_data_dir()
        .or_else(|_| app.path().app_local_data_dir())
        .map_err(|e| format!("アプリデータディレクトリの取得に失敗: {}", e))?;
    let rigil_dir = app_data_dir.join("rigil");
    let tabs_file = rigil_dir.join("tabs.json");
    
    // ファイルが存在しない場合はnullを返す
    if !tabs_file.exists() {
        return Ok("null".to_string());
    }
    
    // ファイルを読み込み
    let json_data = std::fs::read_to_string(&tabs_file).map_err(|e| format!("ファイル読み込みエラー: {}", e))?;
    
    // JSONをパース
    let tab_data: TabData = serde_json::from_str(&json_data).map_err(|e| format!("JSON解析エラー: {}", e))?;
    
    // タブデータ全体をJSONとして返す
    Ok(serde_json::to_string(&tab_data).map_err(|e| format!("JSON変換エラー: {}", e))?)
}
