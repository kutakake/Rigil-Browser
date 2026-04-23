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

fn is_safe_url(url: &str) -> bool {
    let url_lower = url.trim().to_lowercase();
    
    // 危険なスキームをチェック
    let dangerous_schemes = ["javascript:", "data:", "vbscript:", "file:"];
    for scheme in dangerous_schemes.iter() {
        if url_lower.starts_with(scheme) {
            return false;
        }
    }
    
    true
}

fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
}

fn escape_js_string(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('\n', "\\n")
        .replace('\r', "\\r")
        .replace('\t', "\\t")
        .replace('"', "\\\"")
        .replace('\'', "\\'")
}

// URL を正規化する関数
fn normalize_url(name: &str) -> String {
    if name.is_empty() {
        return String::new();
    }

    // 危険な URL はブロック
    if !is_safe_url(name) {
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

// ベース URL を取得する関数
fn get_base_url(url: &str) -> String {
    let mut slash_count = 0;
    let mut end = None;

    for (byte_idx, ch) in url.char_indices() {
        if ch == '/' {
            slash_count += 1;
            if slash_count == 3 {
                end = Some(byte_idx + ch.len_utf8());
                break;
            }
        }
    }

    let base_part = match end {
        Some(idx) => &url[..idx],
        None => return url.to_string(),
    };
    let mut base_url = String::from(base_part);

    if slash_count == 3 && end.is_some() {
        let remaining_path = &url[end.unwrap()..];
        if let Some(last_slash_pos) = remaining_path.rfind('/') {
            base_url.push_str(&remaining_path[..=last_slash_pos]);
        }
    }

    base_url
}

// 相対 URL を絶対 URL に変換する関数
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

// href を抽出する関数
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
                // ネストした a タグ
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

    // リンクテキストが空の場合は URL を使用
    let display_text = if link_content.trim().is_empty() {
        resolved_href.clone()
    } else {
        link_content.trim().to_string()
    };

    let escaped_href = escape_js_string(&resolved_href);
    let escaped_display_text = escape_html(&display_text);

    format!(
        "<button id=\"hreftag\" onclick=\"javascript:{{document.getElementById('greet-input').value='{}';window.globalFunction.greet()}}\">{}</button>",
        escaped_href, escaped_display_text
    )
}
use reader_mode_maker;
// HTML を解析してテキストに変換する関数
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
    
    // 正規化後に空になった場合はエラーを返す
    if normalized_url.is_empty() {
        return Ok("<title>Error</title>無効な URL です".to_string());
    }

    let base_url = get_base_url(&normalized_url);
    
    match gethtml(&normalized_url).await {
        Ok(html_body) => Ok(parse_html_to_text(&html_body, &base_url, &normalized_url)),
        Err(e) => Ok(format!("<title>Error</title>ページの取得に失敗しました：{}", e)),
    }
}

use wreq::Client;
use wreq_util::Emulation;

async fn gethtml(url: &str) -> wreq::Result<String> {
    let client = Client::builder()
        .emulation(Emulation::Firefox139)
        .build()?;

    let (url_without_query, query_str) = match url.split_once('?') {
        Some((base, qs)) => (base.to_string(), qs),
        None => return client.get(url).send().await?.text().await,
    };

    let mut query: Vec<(String, String)> = vec![];
    for pair in query_str.split('&') {
        if let Some((k, v)) = pair.split_once('=') {
            let value = v.chars()
                .filter(|&ch| ch != '/')
                .collect::<String>();
            query.push((k.to_string(), value));
        } else {
            query.push((pair.to_string(), String::new()));
        }
    }

    match client.get(&url_without_query).query(&query).send().await {
        Ok(html) => html.text().await,
        Err(e) => Err(e),
    }
}

#[tauri::command]
async fn save_tabs(app: tauri::AppHandle, tabs: String, current_tab_number: i32, current_page_number: i32) -> std::result::Result<String, String> {
    let tab_data = TabData {
        tabs,
        current_tab_number,
        current_page_number,
    };

    let json_data = serde_json::to_string(&tab_data).map_err(|e| e.to_string())?;

    // アプリデータディレクトリのパスを取得（Windows と Android の両方に対応）
    let app_data_dir = app.path().app_data_dir()
        .or_else(|_| app.path().app_local_data_dir())
        .map_err(|e| format!("アプリデータディレクトリの取得に失敗：{}", e))?;
    let rigil_dir = app_data_dir.join("rigil");
    let tabs_file = rigil_dir.join("tabs.json");

    // ディレクトリが存在しない場合は作成
    if !rigil_dir.exists() {
        std::fs::create_dir_all(&rigil_dir).map_err(|e| format!("ディレクトリ作成エラー：{}", e))?;
    }

    // ファイルに書き込み
    std::fs::write(&tabs_file, &json_data).map_err(|e| format!("ファイル書き込みエラー：{}", e))?;

    Ok("保存完了".to_string())
}

#[tauri::command]
async fn read_tabs(app: tauri::AppHandle) -> std::result::Result<String, String> {
    // アプリデータディレクトリのパスを取得（Windows と Android の両方に対応）
    let app_data_dir = app.path().app_data_dir()
        .or_else(|_| app.path().app_local_data_dir())
        .map_err(|e| format!("アプリデータディレクトリの取得に失敗：{}", e))?;
    let rigil_dir = app_data_dir.join("rigil");
    let tabs_file = rigil_dir.join("tabs.json");

    // ファイルが存在しない場合は null を返す
    if !tabs_file.exists() {
        return Ok("null".to_string());
    }

    // ファイルを読み込み
    let json_data = std::fs::read_to_string(&tabs_file).map_err(|e| format!("ファイル読み込みエラー：{}", e))?;

    // JSON をパース
    let tab_data: TabData = serde_json::from_str(&json_data).map_err(|e| format!("JSON 解析エラー：{}", e))?;

    // タブデータ全体を JSON として返す
    Ok(serde_json::to_string(&tab_data).map_err(|e| format!("JSON 変換エラー：{}", e))?)
}
