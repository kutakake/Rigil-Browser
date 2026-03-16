// タブ管理機能

// タブ HTML を生成する共通関数
function renderTabsHTML() {
  let tabsString = "";
  const closeButtonPosition = localStorage.getItem("tab_close_button_position") || "left";
  
  for (let i = 0; i < tabs.length; i++) {
    const tabTitle = getTabTitle(i);
    tabsString += createTabItemHTML(i, tabTitle, closeButtonPosition);
  }
  return tabsString;
}

// タブタイトルを取得する関数
function getTabTitle(index) {
  return tabs[index].title[tabs[index].page_number] || "New tab";
}

// 単一のタブアイテム HTML を生成する関数
function createTabItemHTML(index, tabTitle, closeButtonPosition) {
  if (closeButtonPosition === "left") {
    return `<div class='tab-item'>
      <button class='tab-close-button' onclick='window.globalFunction.remove_tab(${index})'>×</button>
      <button class='tab-title-button' onclick='window.globalFunction.switch_tab(${index})'>
        <nobr>${tabTitle}</nobr>
      </button>
    </div>`;
  } else {
    return `<div class='tab-item'>
      <button class='tab-title-button' onclick='window.globalFunction.switch_tab(${index})'>
        <nobr>${tabTitle}</nobr>
      </button>
      <button class='tab-close-button' onclick='window.globalFunction.remove_tab(${index})'>×</button>
    </div>`;
  }
}

function show_hide_tabs() {
  try {
    if (tabs_shown === 0) {
      tabs_shown = 1;
      
      // 下部ツールバーをメニュー表示用に切り替え
      toggleToolbars(true);
      
      // タブメニューの内容を生成
      tab_element.innerHTML = renderTabsHTML();
      showTabElement();
    } else {
      tabs_shown = 0;
      
      // 下部ツールバーを通常表示に戻す
      toggleToolbars(false);
      hideTabElement();
    }
  } catch(e) {
    handleError(e, "show_hide_tabs");
  }
}

// ツールバーの切り替え
function toggleToolbars(showMenuToolbar) {
  document.getElementById("normal_toolbar").style.display = showMenuToolbar ? "none" : "block";
  document.getElementById("menu_toolbar").style.display = showMenuToolbar ? "block" : "none";
}

// タブ要素を表示
function showTabElement() {
  tab_element.innerHTML = renderTabsHTML();
  tab_element.style.visibility = "visible";
  tab_element.style.opacity = "1";
  tab_element.style.transition = "opacity 0.3s";
}

// タブ要素を非表示
function hideTabElement() {
  tab_element.style.opacity = "0";
  tab_element.style.transition = "opacity 0.3s";
  tabs_visibility_interval = window.setInterval(collapse_tabs_visibility, 100);
}

// エラーハンドリングの共通関数
function handleError(error, context) {
  console.error(`[${context}]`, error);
  const errorMessageEl = document.getElementById("errormessage");
  if (errorMessageEl) {
    errorMessageEl.innerHTML = error.message || String(error);
  }
}

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

  // メニューを閉じる
  if (tabs_shown == 1) {
    show_hide_tabs();
  }
  
  save_status();
}

function remove_tab(tab_number) {
  // タブを削除
  tabs.splice(tab_number, 1);
  
  // タブが空の場合は新規タブを作成
  if (tabs.length === 0) {
    tabs = [newtab];
  }
  
  // 現在のタブ番号を更新
  updateCurrentTabAfterRemoval(tab_number);
  
  // タブの再描画
  tab_element.innerHTML = renderTabsHTML();
  
  save_status();
}

// タブ削除後の current_tab_number を更新
function updateCurrentTabAfterRemoval(removedTabIndex) {
  if (removedTabIndex < current_tab_number) {
    current_tab_number--;
  } else if (removedTabIndex === current_tab_number) {
    current_tab_number = Math.max(0, current_tab_number - 1);
    
    // 新しいタブの状態を設定
    const newPageNumber = tabs[current_tab_number].page_number || "0";
    current_page_number = parseInt(newPageNumber);
    current_page_url = tabs[current_tab_number].urls[current_page_number] || "rigil:newtab";
    body_element.innerHTML = tabs[current_tab_number].contents[current_page_number] || "New tab";
  }
} 