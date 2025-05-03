const { invoke } = window.__TAURI__.core;

const greetInputEl = document.querySelector("#greet-input");
const greetMsgEl = document.querySelector("#greet-msg");
let current_page_url = "";
let current_tab_number = 0;
let tabs = [];
let current_page_number = 0; //その履歴のうちどこを開いているか
let tabs_shown = 0;
let tabs_visibility_interval;
let tab_history = ["New tab"];
const tab_element = document.getElementById("tabs");
const body_element = document.getElementById("body2");

const newtab = {
  title: ["New tab"],
  urls: ["rigil:newtab"],
  contents: ["New tab"],
  page_number: [0],
};
//alert(localStorage.getItem("tabs"));
/*
localStorage.removeItem("tabs");
localStorage.removeItem("tab_number");
localStorage.removeItem("page_number");
*/
//if (localStorage.getItem("tabs") != null) {
  let status = await read_status();
//tabs = JSON.parse(await read_status());//localStorage.getItem("tabs"));
//current_tab_number = JSON.parse(localStorage.getItem("current_tab_number"));
//current_page_number = JSON.parse(localStorage.getItem("current_page_number"));
//} else {
  if (status == "") {
    tabs.push(newtab);
    save_status();
  } else {
    tabs = JSON.parse(status);
    current_tab_number = JSON.parse(localStorage.getItem("tab_number"));
    current_page_number = JSON.parse(localStorage.getItem("page_number"));
  }
  tab_history = tabs[current_tab_number].contents; //今開いているタブの履歴。各要素はそれぞれのページのHTML
  var url_history = tabs[current_tab_number].urls;
  body_element.innerHTML = tab_history[tab_history.length - 1];
async function change_tab_number(move_number) {
  //current_page_numberとtabs内のpage_numberは常に同じなのでこの関数で同時に書き換える
  current_page_number += move_number;
  tabs[current_tab_number].page_number = [current_page_number.toString()];
}
/*
async function greet() {
  //GETしたHTMLを表示、タブの履歴を更新する
  const html = await get_page();
  body_element.innerHTML = html;
  current_page_url = document.getElementById("greet-input").value;
  change_tab_number(1);
  console.log(html);
  const tab_histry_length = tab_history.length;
  if (tab_histry_length > current_page_number) {
    for (let i = current_page_number; tab_histry_length > i; i++) {
      tab_history.pop();
      url_history.pop();
      tabs[current_tab_number].title.pop();
    }
  }
  if (tabs.length == 0) {
    tabs.push({
      title: [document.title],
      urls: url_history,
      contents: tab_history,
      page_number: [current_page_number.toString()],
    });
  }
  tab_history.push(html);
  url_history.push(current_page_url);
  tabs[current_tab_number].title.push(document.title);
  tabs[current_tab_number].contents = tab_history;
  tabs[current_tab_number].urls = url_history;
  save_status();
}
*/
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
  return await invoke("greet", { name: greetInputEl.value });
}

document.querySelector("#greet-form").addEventListener("submit", (e) => {
  e.preventDefault();
  greet();
});

document.querySelector("#greet-form").addEventListener("click", (e) => {
  if (greetInputEl.value == "rigil:newtab") {
    greetInputEl.value = "";
  }
});

document.querySelector("#hreftag").addEventListener("click", (e) => {
  e.preventDefault();
  greetInputEl.value = e.href;
  greet();
});

/*
window.addEventListener("mouseup", (e) => {
  //戻る、進むボタン
  if (e.button == 3) {
    if (current_page_number >= 1) {
      console.log(current_page_number);
      change_tab_number(-1);
      current_page_url = url_history[current_page_number];
      is_empty_content();
      body_element.innerHTML = tab_history[current_page_number];
      document.getElementById("greet-input").value = current_page_url;
      save_status();
      console.log(current_page_number);
    }
  } else if (e.button == 4) {
    if (current_page_number < tab_history.length - 1) {
      change_tab_number(1);
      current_page_url = url_history[current_page_number];
      is_empty_content();
      body_element.innerHTML = tab_history[current_page_number];
      document.getElementById("greet-input").value = current_page_url;
      save_status();
    }
  }
});
*/

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

// マウスイベントリスナーを新しいものに置き換え
window.addEventListener("mouseup", async (e) => {
  if (e.button == 3) {
    await navigateHistory(-1); // 戻る
  } else if (e.button == 4) {
    await navigateHistory(1); // 進む
  }
});

window.addEventListener("ionBackButton", async (e) => {
  await navigateHistory(-1);
});

function reflesh_page() {
  document.getElementById("greet-input").value = current_page_url;
  greet();
}
/*
function show_hide_tabs() {
  //タブの表示、非表示
  if (tabs_shown == 0) {
    tabs_shown = 1;
    let tabs_string =
      "<div id='tab_control'><button type='button' onclick='window.globalFunction.show_hide_tabs()'>≡</button><button type='button' onclick='window.globalFunction.add_tab()'>+</button></div><br>";
    for (let i = 0; i < tabs.length; i++) {
      tabs_string =
        tabs_string +
        "<button onclick='window.globalFunction.remove_tab(" +
        i +
        ")'>×</button><br><button onclick='window.globalFunction.switch_tab(" +
        i +
        ")'>" +
        "<nobr>" +
        tabs[i].title[tabs[i].page_number] +
        "</nobr>" +
        "</button><br>";
    }
    tab_element.innerHTML = tabs_string; //0.3秒かけて表示する
    tab_element.style.visibility = "visible";
    tab_element.style.opacity = "1";
    tab_element.style.transition = "opacity 0.3s ";
  } else {
    tabs_shown = 0; //0.3秒かけて非表示にする
    tab_element.style.opacity = "0";
    tab_element.style.transition = "opacity 0.3s ";
    tabs_visibility_interval = window.setInterval(
      collapse_tabs_visibility,
      100,
    );
  }
}
*/

function show_hide_tabs() {
  try {
    if (tabs_shown == 0) {
      tabs_shown = 1;
      let tabs_string =
          "<div id='tab_control'><button type='button' onclick='window.globalFunction.show_hide_tabs()'>≡</button><button type='button' onclick='window.globalFunction.add_tab()'>+</button></div><br>";
      for (let i = 0; i < tabs.length; i++) {
        const tabTitle = tabs[i].title[tabs[i].page_number] || "New tab";
        tabs_string +=
            "<button onclick='window.globalFunction.remove_tab(" +
            i +
            ")'>×</button><br><button onclick='window.globalFunction.switch_tab(" +
            i +
            ")'>" +
            "<nobr>" +
            tabTitle +
            "</nobr>" +
            "</button><br>";
      }
      tab_element.innerHTML = tabs_string;
      tab_element.style.visibility = "visible";
      tab_element.style.opacity = "1";
      tab_element.style.transition = "opacity 0.3s ";
    } else {
      tabs_shown = 0;
      tab_element.style.opacity = "0";
      tab_element.style.transition = "opacity 0.3s ";
      tabs_visibility_interval = window.setInterval(
          collapse_tabs_visibility,
          100,
      );
    }
  } catch(e) {
    alert(e);
    document.getElementById("errormessage").innerHTML = e;
  }
}
/*
async function switch_tab(tab_number) {
  let tab_length = tabs[current_tab_number];
  tabs[current_tab_number].contents = [];
  for (let i = 0; i < tab_length; i++) {
    tabs[current_tab_number].contents.push("");
  }
  current_tab_number = tab_number;
  tab_history = tabs[current_tab_number].contents;
  current_page_number = tabs[current_tab_number].page_number;
  current_page_url = tabs[current_tab_number].urls[current_page_number]; //tabs[current_tab_number].urls.length-1]

  await is_empty_content();
  body_element.innerHTML = tab_history[current_page_number];
  document.getElementById("greet-input").value = current_page_url;

  show_hide_tabs();
  save_status();
}
*/

async function switch_tab(tab_number) {
  // タブの内容をクリアする前に長さを保存
  let tab_length = tabs[current_tab_number].contents.length;
  // 現在のタブの内容をクリア
  tabs[current_tab_number].contents = new Array(tab_length).fill("");

  // 新しいタブに切り替え
  current_tab_number = tab_number;
  tab_history = tabs[current_tab_number].contents;
  current_page_number = parseInt(tabs[current_tab_number].page_number);
  current_page_url = tabs[current_tab_number].urls[current_page_number];

  await is_empty_content();
  body_element.innerHTML = tab_history[current_page_number];
  document.getElementById("greet-input").value = current_page_url;

  // タブを表示/非表示
  show_hide_tabs();
  save_status();
}

function collapse_tabs_visibility() {
  if (tab_element.style.opacity <= 0) {
    tab_element.style.visibility = "collapse";
    window.clearInterval(tabs_visibility_interval);
  }
}
/*
function add_tab() {
  current_page_number = -1;
  current_page_url = "rigil:newtab";
  current_tab_number = tabs.length;

  tabs.push(newtab);
  document.title = "New tab";
  body_element.innerHTML = "";
  tab_element.innerHTML =
    tab_element.innerHTML +
    "<button onclick='window.globalFunction.remove_tab(" +
    tabs.length +
    ")'>×</button><br><button onclick='window.globalFunction.switch_tab(" +
    tabs.length +
    ")'><nobr>New tab</nobr></button><br>";
  switch_tab(tabs.length - 1);
  save_status();
}
*/

function add_tab() {
  // 新しいタブ用の初期状態を作成
  const newTab = {
    title: ["New tab"],
    urls: ["rigil:newtab"],
    contents: ["New tab"],
    page_number: ["0"],
  };

  // タブを追加
  tabs.push(newTab);
  current_tab_number = tabs.length - 1;
  current_page_number = 0;
  current_page_url = "rigil:newtab";

  // 新しいタブの状態を設定
  document.title = "New tab";
  body_element.innerHTML = "New tab";
  document.getElementById("greet-input").value = "rigil:newtab";

  // タブ履歴を初期化
  tab_history = ["New tab"];
  url_history = ["rigil:newtab"];

  // タブ一覧を更新して表示
  show_hide_tabs();
  save_status();
}

/*
function remove_tab(tab_number) {
  tabs.splice(tab_number, 1);
  if (tabs.length == 0) {
    tabs = [newtab];
  } else if (tab_number < current_tab_number) {
    current_tab_number--;
  } else if (tab_number == current_tab_number) {
    current_tab_number--;
    current_page_number = tabs[current_tab_number].page_number;
    current_page_url = tabs[current_tab_number].page_number;
    body_element.innerHTML =
      tabs[current_tab_number].contents[current_page_number];
  }

  //tabsの再描画
  let tabs_string =
    "<div id='tab_control'><button type='button' onclick='window.globalFunction.show_hide_tabs()'>≡</button><button type='button' onclick='window.globalFunction.add_tab()'>+</button></div><br>";
  for (let i = 0; i < tabs.length; i++) {
    tabs_string =
      tabs_string +
      "<button onclick='window.globalFunction.remove_tab(" +
      i +
      ")'>×</button><br><button onclick='window.globalFunction.switch_tab(" +
      i +
      ")'>" +
      "<nobr>" +
      tabs[i].title +
      "</nobr>" +
      "</button><br>";
  }
  tab_element.innerHTML = tabs_string;

  save_status();
}
*/

function remove_tab(tab_number) {
  tabs.splice(tab_number, 1);
  if (tabs.length == 0) {
    tabs = [newtab];
  } else if (tab_number < current_tab_number) {
    current_tab_number--;
  } else if (tab_number == current_tab_number) {
    current_tab_number--;
    current_page_number = tabs[current_tab_number].page_number;
    current_page_url = tabs[current_tab_number].page_number;
    body_element.innerHTML =
      tabs[current_tab_number].contents[current_page_number];
  }

  // タブの再描画部分を修正
  let tabs_string =
    "<div id='tab_control'><button type='button' onclick='window.globalFunction.show_hide_tabs()'>≡</button><button type='button' onclick='window.globalFunction.add_tab()'>+</button></div><br>";
  for (let i = 0; i < tabs.length; i++) {
    // タイトルの参照方法を修正
    const tabTitle = tabs[i].title[tabs[i].page_number] || "New tab";
    tabs_string +=
      "<button onclick='window.globalFunction.remove_tab(" +
      i +
      ")'>×</button><br><button onclick='window.globalFunction.switch_tab(" +
      i +
      ")'>" +
      "<nobr>" +
      tabTitle +
      "</nobr>" +
      "</button><br>";
  }
  tab_element.innerHTML = tabs_string;

  save_status();
}

async function read_status() {
  return localStorage.getItem("tabs");
  //return await invoke("read");
}

async function save_status() {
  tabs[current_tab_number].contents = tab_history;
  localStorage.setItem("tab_number", JSON.stringify(current_tab_number));
  localStorage.setItem("page_number", JSON.stringify(current_page_number));

  localStorage.setItem("tabs", JSON.stringify(tabs));
  //await invoke("save", { tabs: JSON.stringify(tabs) });
}
/*
async function is_empty_content() {
  if (tabs[current_tab_number].contents[current_page_number] == null) {
    greetInputEl.value = current_page_url;
    const html = await get_page();
    tabs[current_tab_number].contents[current_page_number] = html;
  }
}
*/

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
/*
window.globalFunction = {
  greet: greet,
  reflesh_page: reflesh_page,
  show_hide_tabs: show_hide_tabs,
  switch_tab: switch_tab,
  add_tab: add_tab,
  remove_tab: remove_tab,
};
*/
window.globalFunction = [];
window.globalFunction.greet = greet;
window.globalFunction.reflesh_page = reflesh_page;
window.globalFunction.show_hide_tabs = show_hide_tabs;
window.globalFunction.switch_tab = switch_tab;
window.globalFunction.add_tab = add_tab;
window.globalFunction.remove_tab = remove_tab;