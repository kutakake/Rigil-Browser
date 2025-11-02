const { invoke } = window.__TAURI__.core;

// グローバル変数
let greetInputEl;
let greetMsgEl;
let current_page_url = "";
let current_tab_number = 0;
let tabs = [];
let current_page_number = 0; //その履歴のうちどこを開いているか
let tabs_shown = 0;
let tabs_visibility_interval;
let tab_history = ["New tab"];
let tab_element;
let body_element;
let url_history;

const newtab = {
  title: ["New tab"],
  urls: ["rigil:newtab"],
  contents: ["New tab"],
  page_number: [0],
};

// アプリの初期化関数
async function initialize_app() {
  // DOM要素を取得
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  tab_element = document.getElementById("tabs");
  body_element = document.getElementById("body2");

  // タブ状態を読み込み
  let tab_status = await read_status();
  if (tab_status === null) {
    tabs.push(newtab);
    save_status();
  } else {
    tabs = JSON.parse(tab_status);
    // current_tab_numberとcurrent_page_numberはread_status内で設定済み
  }
  tab_history = tabs[current_tab_number].contents; //今開いているタブの履歴。各要素はそれぞれのページのHTML
  url_history = tabs[current_tab_number].urls;
  body_element.innerHTML = tab_history[tab_history.length - 1];
}

async function change_tab_number(move_number) {
  //current_page_numberとtabs内のpage_numberは常に同じなのでこの関数で同時に書き換える
  current_page_number += move_number;
  tabs[current_tab_number].page_number = [current_page_number.toString()];
}

async function greet() {
  //GETしたHTMLを表示、タブの履歴を更新する
  const html = await get_page();
  body_element.innerHTML = html;
  current_page_url = document.getElementById("greet-input").value;
  change_tab_number(1);
  console.log(html);

  // タブの履歴を更新
  const tab_history_length = tab_history.length;
  if (tab_history_length > current_page_number) {
    for (let i = current_page_number; tab_history_length > i; i++) {
      tab_history.pop();
      url_history.pop();
      tabs[current_tab_number].title.pop();
    }
  }

  // タブが存在しない場合は新規作成
  if (tabs.length == 0) {
    tabs.push({
      title: [document.title],
      urls: [current_page_url],
      contents: [html],
      page_number: [current_page_number.toString()],
    });
  }

  // 現在のタブの内容を更新
  tab_history.push(html);
  url_history.push(current_page_url);
  tabs[current_tab_number].title.push(document.title);
  tabs[current_tab_number].contents = tab_history;
  tabs[current_tab_number].urls = url_history;

  // タブの内容が正しく保存されていることを確認
  if (!tabs[current_tab_number].contents[current_page_number]) {
    tabs[current_tab_number].contents[current_page_number] = html;
  }

  save_status();
}

async function get_page() {
  const useProxy = localStorage.getItem("use_proxy") === "true";
  
  if (useProxy) {
    try {
      // プロキシ経由でページを取得
      return await get_page_via_proxy(greetInputEl.value);
    } catch (error) {
      console.error("プロキシ経由でのページ取得に失敗:", error);
      // プロキシが失敗した場合は通常の方法にフォールバック
      console.log("通常の方法でページを取得します...");
      return await invoke("greet", { name: greetInputEl.value });
    }
  } else {
    // 通常の方法でページを取得
    return await invoke("greet", { name: greetInputEl.value });
  }
}

async function navigateHistory(direction) {
  const newPageNumber = current_page_number + direction;

  if (newPageNumber >= 0 && newPageNumber < tab_history.length) {
    await change_tab_number(direction);
    current_page_url = url_history[current_page_number];

    await is_empty_content();
    body_element.innerHTML = tab_history[current_page_number];
    document.getElementById("greet-input").value = current_page_url;
    save_status();

    return true;
  }
  return false;
}

function reflesh_page() {
  document.getElementById("greet-input").value = current_page_url;
  greet();
}

async function read_status() {
  try {
    const result = await invoke("read_tabs");
    if (result === "null") {
      return null;
    }
    const tabData = JSON.parse(result);
    // localStorageからcurrent_tab_numberとcurrent_page_numberを設定
    current_tab_number = tabData.current_tab_number;
    current_page_number = tabData.current_page_number;
    return tabData.tabs;
  } catch (error) {
    console.error("タブ情報の読み込みに失敗しました:", error);
    return null;
  }
}

async function save_status() {
  try {
    tabs[current_tab_number].contents = tab_history;
    await invoke("save_tabs", { 
      tabs: JSON.stringify(tabs),
      currentTabNumber: current_tab_number,
      currentPageNumber: current_page_number
    });
  } catch (error) {
    console.error("タブ情報の保存に失敗しました:", error);
  }
}

async function is_empty_content() {
  if (!tabs[current_tab_number].contents[current_page_number]) {
    try {
      greetInputEl.value = current_page_url;
      const html = await get_page();
      tabs[current_tab_number].contents[current_page_number] = html;
      tab_history = tabs[current_tab_number].contents; // tab_historyも更新
    } catch (error) {
      console.error("Failed to load content:", error);
      // エラー時の処理（例：エラーページを表示するなど）
    }
  }
} 