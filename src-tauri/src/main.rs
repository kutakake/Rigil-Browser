

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
extern crate reqwest;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command



    #[tauri::command]
fn greet(name: &str) -> String {
    //let mut resp = reqwest::get("https://www.rust-lang.org").unwrap();
    let body = gethtml(name.to_string());
    //println!("{:?}", body);
    //let contents: Vec<char> = body.expect("REASON").text().unwrap().chars().collect();
    let contents: Vec<char> = body.chars().collect();
    let mut formatted_text: String = "".to_string();
    //formatted_text = format!("{}{}", formatted_text, contents);
    let length = contents.len();
    let mut i: usize = 0;
    let mut tagpoint: usize = 0;
    let mut href: String = "".to_string();
    let mut button_number = 1;
    let mut index_link_vec: Vec<char> = name.to_string().chars().collect();
    let mut slashcount = 0;
    let mut index_link = "".to_string();
    let mut link_length = index_link_vec.len();

    for i in 0..link_length-1 {//URLのうち左からTLDまでの部分を取得
        if i >= link_length {
            break;
        }
        if index_link_vec[i] == '/' {
            slashcount += 1;
        }
        if slashcount >= 3 {
            index_link = format!("{}{}", index_link, index_link_vec[i]);
            break;
        }
        if i >= link_length {
            break;
        }
        index_link = format!("{}{}", index_link, index_link_vec[i]);
    }
    index_link = format!("{}{}", index_link, index_link_vec[link_length-1]);

    
    formatted_text = format!("{}{}", formatted_text, "<script type=\"module\" src=\"/main.js\" defer></script>");
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
            //tag = format!("{}{}", tag, contents[i]);
            if tag.contains("<a href") {
                tagpoint = 1;
                let mut tagvec: Vec<char> = tag.chars().collect();
                let mut tag_length = tagvec.len();
                href = "".to_string();
                loop {//このブロックでhrefの中身を取得
                    if tagpoint >= tag_length {
                        break;
                    }
                    if tagvec[tagpoint] == '\"' {
                        loop {
                            tagpoint += 1;
                            if tagpoint >= tag_length {
                                break;
                            }
                            else if tagvec[tagpoint] == '\"' {
                                break;
                            }
                            else if tagvec[tagpoint] == ' ' {
                                break;
                            }
                            href = format!("{}{}", href, tagvec[tagpoint]);
                        }
                    }
                    tagpoint += 1;
                    
                }
                if href.contains("http") {//hrefが相対パスだった場合今いる場所のURLを先頭につける

                }
                else {
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
                        tagpoint = 1;
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
                        tag = "".to_string();
                        for ii in 2..tag_length-1 {
                            tag = format!("{}{}", tag, tagvec[ii]);
                        }
                        
                        //println!("{}", tag);
                        let mut buttontag = format!("{}{}{}{}{}{}", "".to_string(), "<button type=\"button\" onclick=\"{document.getElementById('greet-input').value='", href, "';scrollTo(100, 200);}\" id=\"page_button_", button_number, "\">");
                        //let mut buttontag = format!("{}{}{}{}", "".to_string(), "<button type=\"button\" onclick=\"document.write(&quot;<script type='module' src='/main.js' defer></script><script>goto_page('https://gigazine.net')</script>&quot;)\" id=\"page_button_", button_number, "\">");
                        buttontag = format!("{}{}{}", buttontag, tag, "</button>");
                        formatted_text = format!("{}{}", formatted_text, buttontag);
                        let mut button_script = format!("{}{}{}{}", "".to_string(), "<script>
                        window.addEventListener('DOMContentLoaded', () => {
                            greetInputEl = document.querySelector('#page_button_", button_number, "');
                            document.addEventListener('click', (e) => {
                              e.preventDefault();
                              greet();
                            });
                          });
                        </script>");
                        formatted_text = format!("{}{}", formatted_text, button_script);
                        button_number  += 1;
                    }
                }
            }
            else if tag.contains("<script") {
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
            }
            else if tag.contains("<style") {
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
            }
            else if tag.contains("<br") {
                formatted_text = format!("{}{}", formatted_text, tag);
            }
            else if tag.contains("<br /") {
                formatted_text = format!("{}{}", formatted_text, tag);
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
        }
        else {
            break;
        }
    }
    println!("{}", formatted_text);
    formatted_text
    
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn gethtml(url: String) -> String {
    let html = match reqwest::blocking::get(url) {
        Ok(html) => return html.text().unwrap(),

        Err(e) => {
            println!("{}", e);
            return "Oops!".to_string()
        },
    };
}