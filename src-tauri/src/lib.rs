use serde::{Deserialize, Serialize};
use tauri::{Manager, Result};

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
    if href.is_empty() {
        return String::new();
    }

    let resolved_href = resolve_relative_url(&href, base_url, current_url);

    // リンクテキストを取得するため、</a>まで読み進める
    let mut link_content = String::new();
    let mut tag_depth = 0;

    while *i < contents.len() {
        if contents[*i] == '<' {
            // 新しいタグの開始をチェック
            let mut peek_tag = String::new();
            let mut peek_i = *i;

            while peek_i < contents.len() && contents[peek_i] != '>' {
                peek_tag.push(contents[peek_i]);
                peek_i += 1;
            }
            if peek_i < contents.len() {
                peek_tag.push(contents[peek_i]);
            }

            if peek_tag.to_lowercase().contains("</a>") {
                // 終了タグが見つかった
                *i = peek_i + 1;
                break;
            } else if peek_tag.starts_with("<a ") || peek_tag == "<a>" {
                // ネストしたaタグ
                tag_depth += 1;
            }

            // タグをスキップ
            *i = peek_i + 1;
        } else {
            // 通常のテキスト
            link_content.push(contents[*i]);
            *i += 1;
        }
    }

    // リンクテキストが空の場合はURLを使用
    let display_text = if link_content.trim().is_empty() {
        resolved_href.clone()
    } else {
        link_content.trim().to_string()
    };

    format!(
        "<button id=\"hreftag\" onclick=\"javascript:{{document.getElementById('greet-input').value='{}';window.globalFunction.greet()}}\">{}</button>",
        resolved_href, display_text
    )
}
use reader_mode_maker;
// HTMLを解析してテキストに変換する関数
fn parse_html_to_text(html: &str, base_url: &str, current_url: &str) -> String {
    let culled_html = reader_mode_maker::culling(html);
    let contents: Vec<char> = culled_html.chars().collect();
    let mut formatted_text = "<script type=\"module\" src=\"/main.js\" defer></script>".to_string();
    let mut i = 0;
    while i < contents.len() {
        if contents[i] == '<' {
            let mut tag = String::new();

            // タグを読み取り
            while i < contents.len() {
                tag.push(contents[i]);
                i += 1;
                if contents[i-1] == '>' {
                    break;
                }
            }

            // タグの種類に応じて処理
            let tag_lower = tag.to_lowercase();
            if tag_lower.contains("<a ") || tag_lower == "<a>" {
                let link_html = process_link_tag(&tag, &contents, &mut i, base_url, current_url);
                if !link_html.is_empty() {
                    formatted_text.push_str(&link_html);
                }
            } else {
                formatted_text = format!("{}{}", formatted_text, tag);
            }
        } else {
            // 通常のテキスト
            formatted_text.push(contents[i]);
            i += 1;
        }
    }
    formatted_text
}

#[tauri::command]
async fn greet(name: &str) -> Result<String> {
    if name.is_empty() {
        return Ok(String::new());
    }

    if name.contains("rigil:newtab") {
        return Ok("<title>New tab</title>New tab".to_string());
    }

    let normalized_url = normalize_url(name);
    let base_url = get_base_url(&normalized_url);
    let html_body = gethtml(&normalized_url).await.unwrap();

    Ok(parse_html_to_text(&html_body, &base_url, &normalized_url))
}

use wreq::Client;
use wreq_util::Emulation;

async fn gethtml(url: &str) -> wreq::Result<String> {
    //let client = reqwest::blocking::Client::new();
    let client = Client::builder()
        .emulation(Emulation::Firefox139)
        .build()?;
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
    let resp = client.get(url_without_query).query(&query).send().await?;
    let text = resp.text().await?;
    Ok(text)
    /*
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
    */
}

#[tauri::command]
async fn save_tabs(app: tauri::AppHandle, tabs: String, current_tab_number: i32, current_page_number: i32) -> std::result::Result<String, String> {
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
async fn read_tabs(app: tauri::AppHandle) -> std::result::Result<String, String> {
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
