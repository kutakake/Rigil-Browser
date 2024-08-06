use std::{collections::HashMap, ffi::c_void};
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, read, save])
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
    if namevec[name_length - 1] != '/' {
        namestring = format!("{}{}", namestring, "/");
    }

    let body: String = gethtml(&namestring);
    let contents: Vec<char> = body.chars().collect();
    let mut formatted_text: String = "".to_string();
    let length: usize = contents.len();
    let mut i: usize = 0;
    let index_link_vec: Vec<char> = namestring.to_string().chars().collect();
    let mut slashcount: usize = 0;
    let mut index_link: String = "".to_string();
    let link_length: usize = index_link_vec.len();

    for i in 0..link_length - 1 {
        //URLのうち左からTLDまでの部分を取得
        index_link = format!("{}{}", index_link, index_link_vec[i]);
        if i >= link_length {
            //index_link = format!("{}{}", index_link, index_link_vec[i]);
            break;
        }
        if index_link_vec[i] == '/' {
            slashcount += 1;
        }
        if slashcount == 3 {
            index_link = format!("{}{}", index_link, index_link_vec[i]);
            break;
        }
        if i >= link_length {
            //index_link = format!("{}{}", index_link, index_link_vec[i]);
            break;
        }
    }
    //index_link = format!("{}{}", index_link, index_link_vec[link_length - 1]);
    //println!("index: {}", namestring);

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
                let mut done: bool = false;
                loop {
                    //このブロックでhrefの中身を取得
                    if tagpoint >= tag_length {
                        break;
                    }
                    if tagvec[tagpoint] == '\"' {
                        loop {
                            tagpoint += 1;
                            if tagpoint >= tag_length {
                                done = true;
                                break;
                            } else if tagvec[tagpoint] == '\"' {
                                done = true;
                                break;
                            } /* else if tagvec[tagpoint] == ' ' {
                                  break;
                              }*/
                            href = format!("{}{}", href, tagvec[tagpoint]);
                        }
                        if done {
                            break;
                        }
                    }
                    tagpoint += 1;
                }
                if href.contains("http") { //hrefが相対パスだった場合今いる場所のURLを先頭につける
                } else {
                    href = format!("{}{}", index_link, href);
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
                        for ii in 1..tag_end_point {
                            tagvec.remove(1);
                            tag_length -= 1;
                        }
                        for ii in 1..4 {
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
                            "<a href=\"javascript:{document.getElementById('greet-input').value='",
                            href,
                            "';window.globalFunction.greet()}\">"
                        );
                        hreftag = format!("{}{}{}", hreftag, tag, "</a>");
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

    f.expect("somthing went wrong").read_to_string(&mut contents);

    contents
}

use std::io::{Write, BufWriter};
#[tauri::command]
fn save(tabs: String) -> String {
    let path = "status.txt";
    let f = File::create(path).expect("a");
    let mut bfw = BufWriter::new(f);
    let _ = bfw.write(tabs.as_bytes()).expect("a");
    String::from("done")
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
                "Oops! Something is wrong. The entered url is: ", url
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
