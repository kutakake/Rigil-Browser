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
#[tauri::command]
fn greet(name: &str) -> String {
    if name == "" {
        return "".to_string();
    }
    if name.contains("rigil:newtab") || name == String::from("") {
        return "<title>New tab</title>New tab".to_string();
    }
    let mut namestring: String = name.to_string();
    let namevec: Vec<char> = namestring.chars().collect();
    let mut firsteight: String = "".to_string();
    let name_length: usize = namestring.len();
    if name_length >= 8 {
        //URLの最初の8文字までを取得
        for i in 0..8 {
            firsteight = format!("{}{}", firsteight, namevec[i].to_string());
        }
        if !(firsteight.contains("http://")) && !(firsteight.contains("https://")) {
            //urlのはじめにhttp://かhttps://がなければ追加する
            namestring = format!("{}{}", "https://", namestring);
        }
    } else {
        for i in 0..name_length {
            firsteight = format!("{}{}", firsteight, namevec[i].to_string());
        }
        if !(firsteight.contains("http://")) && !(firsteight.contains("https://")) {
            //urlのはじめにhttp://かhttps://がなければ追加する
            namestring = format!("{}{}", "https://", namestring);
        }
    }
    // 末尾のスラッシュ処理を削除（不要な自動追加を防ぐ）

    let body: String = gethtml(&namestring);
    let contents: Vec<char> = body.chars().collect();
    let mut formatted_text: String = "".to_string();
    let length: usize = contents.len();
    let mut i: usize = 0;
    let index_link_vec: Vec<char> = namestring.to_string().chars().collect();
    let mut slashcount: usize = 0;
    let mut index_link: String = "".to_string();
    let link_length: usize = index_link_vec.len();

    // ベースURLの取得（プロトコル + ドメイン + パス部分まで）
    for i in 0..link_length {
        index_link = format!("{}{}", index_link, index_link_vec[i]);
        if index_link_vec[i] == '/' {
            slashcount += 1;
        }
        if slashcount == 3 {
            // 3つ目のスラッシュまで（https://example.com/）
            break;
        }
    }

    // パス部分がある場合は、最後のスラッシュまでを取得
    if slashcount == 3 && link_length > index_link.len() {
        let remaining_path: String = namestring[index_link.len()..].to_string();
        if remaining_path.contains('/') {
            // 最後のスラッシュまでのパスを取得
            let last_slash_pos = remaining_path.rfind('/').unwrap();
            index_link = format!("{}{}", index_link, &remaining_path[..=last_slash_pos]);
        } else if !remaining_path.is_empty() {
            // ファイル名がある場合は、ディレクトリ部分のみ取得
            index_link = format!("{}{}", index_link, "");
        }
    }

    formatted_text = format!(
        "{}{}",
        formatted_text, "<script type=\"module\" src=\"/main.js\" defer></script>"
    );
    loop {
        if i >= length {
            break;
        }
        if contents[i] == '<' {
            let mut tag: String = "".to_string();
            let mut tag_end_point: usize = 0;
            loop {
                tag = format!("{}{}", tag, contents[i]);
                i += 1;
                if contents[i] == '>' {
                    tag = format!("{}{}", tag, contents[i]);
                    i += 1;
                    break;
                }
            }
            if tag.contains("<a href") {
                let mut tagpoint: usize = 1;
                let mut tagvec: Vec<char> = tag.chars().collect();
                let mut tag_length = tagvec.len();
                let mut href: String = "".to_string();
                loop {
                    //このブロックでhrefの中身を取得
                    if tagpoint >= tag_length {
                        break;
                    }
                    if tagvec[tagpoint] == '\"' {
                        loop {
                            tagpoint += 1;
                            if tagpoint >= tag_length {
                                break;
                            } else if tagvec[tagpoint] == '\"' {
                                break;
                            } /* else if tagvec[tagpoint] == ' ' {
                                  break;
                              }*/
                            href = format!("{}{}", href, tagvec[tagpoint]);
                        }
                        break;
                    }
                    tagpoint += 1;
                }
                if href.contains("http") { //hrefが相対パスだった場合今いる場所のURLを先頭につける
                } else {
                    // 相対パスの適切な結合処理
                    if href.starts_with('/') {
                        // 絶対パス（ルートからの相対パス）の場合
                        // プロトコル + ドメインのみを取得
                        let mut domain_only = String::new();
                        let mut slash_count = 0;
                        for ch in namestring.chars() {
                            domain_only.push(ch);
                            if ch == '/' {
                                slash_count += 1;
                                if slash_count == 3 {
                                    domain_only.pop(); // 最後のスラッシュを削除
                                    break;
                                }
                            }
                        }
                        href = format!("{}{}", domain_only, href);
                    } else {
                        // 相対パス（現在のディレクトリからの相対パス）の場合
                        if index_link.ends_with('/') {
                            href = format!("{}{}", index_link, href);
                        } else {
                            href = format!("{}/{}", index_link, href);
                        }
                    }
                }
                if contents[i] != '<' {
                    loop {
                        tag = format!("{}{}", tag, contents[i]);
                        i += 1;
                        if contents[i] == '>' {
                            break;
                        }
                    }
                    tag = format!("{}{}", tag, contents[i]);
                    if tag.contains("</a>") {
                        tagvec = tag.chars().collect();
                        tag_length = tagvec.len();
                        for ii in 1..tag_length {
                            if tagvec[ii] == '>' {
                                tag_end_point = ii;
                                break;
                            }
                        }
                        for _ii in 1..tag_end_point {
                            tagvec.remove(1);
                            tag_length -= 1;
                        }
                        for _ii in 1..4 {
                            tagvec.pop();
                            tag_length -= 1;
                        }
                        tag = String::from("");
                        for ii in 2..tag_length - 1 {
                            tag = format!("{}{}", tag, tagvec[ii]);
                        }

                        //ハイパーリンク
                        let mut hreftag = format!(

                            "{}{}{}",
                            "<button id=\"hreftag\" onclick=\"javascript:{document.getElementById('greet-input').value='",
                            href,
                            "';window.globalFunction.greet()}\">"
                            /*
                            "{}{}{}{}{}",
                            "<a id=\"hreftag\" href=\"",
                            href,
                            "\" onclick=\"javascript:{document.getElementById('greet-input').value='",
                            href,
                            "';window.globalFunction.greet()}\">"
                            */
                        );
                        hreftag = format!("{}{}{}", hreftag, tag, "</button>");
                        formatted_text = format!("{}{}", formatted_text, hreftag);
                    }
                }
            } else if tag.contains("<script") {
                //scriptはスキップする
                loop {
                    if i >= length {
                        break;
                    }
                    tag = format!("{}{}", tag, contents[i]);
                    if contents[i] == '>' {
                        if tag.contains("</script>") {
                            break;
                        }
                    }
                    i += 1;
                }
            } else if tag.contains("<style") {
                //styleもスキップする
                loop {
                    if i >= length {
                        break;
                    }
                    tag = format!("{}{}", tag, contents[i]);
                    if contents[i] == '>' {
                        if tag.contains("</style>") {
                            break;
                        }
                    }
                    i += 1;
                }
            } else {
                //is_formatted()はリストに挙げられたタグがあれば入力の末尾に">"をつけて返し、なければ""を返す
                formatted_text = format!("{}{}", formatted_text, is_formatted(tag));
            }
            if i < length {
                if contents[i] == '<' {
                    continue;
                }
            }
        }

        if i < length {
            if contents[i] == '>' {
                i += 1;
                continue;
            }
            formatted_text = format!("{}{}", formatted_text, contents[i]);
            i += 1;
        } else {
            break;
        }
    }
    formatted_text
}
/*
use std::fs::File;
use std::io::{BufRead, BufReader, Read};
use std::path::Path;
#[tauri::command]
fn read() -> String {
    let path = "status.txt";
    if !Path::is_file(Path::new(path)) {
        File::create(path);
    }
    let mut f = File::open(path);

    let mut contents = String::new();

    f.expect("something went wrong")
        .read_to_string(&mut contents);

    contents
}

use std::io::{BufWriter, Write};
#[tauri::command]
fn save(tabs: String) -> String {
    let path = "status.txt";
    let f = File::create(path).expect("a");
    let mut bfw = BufWriter::new(f);
    let _ = bfw.write(tabs.as_bytes()).expect("a");
    String::from("done")
}
*/
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
