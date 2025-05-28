// タブ管理機能

function show_hide_tabs() {
  try {
    if (tabs_shown == 0) {
      tabs_shown = 1;
      
      // 下部ツールバーをメニュー表示用に切り替え
      document.getElementById("normal_toolbar").style.display = "none";
      document.getElementById("menu_toolbar").style.display = "block";
      
      // タブメニューの内容を生成（追加ボタンは削除）
      let tabs_string = "";
      const closeButtonPosition = localStorage.getItem("tab_close_button_position") || "left";
      
      for (let i = 0; i < tabs.length; i++) {
        const tabTitle = tabs[i].title[tabs[i].page_number] || "New tab";
        
        if (closeButtonPosition === "left") {
          tabs_string +=
              "<div class='tab-item'>" +
              "<button class='tab-close-button' onclick='window.globalFunction.remove_tab(" +
              i +
              ")'>×</button>" +
              "<button class='tab-title-button' onclick='window.globalFunction.switch_tab(" +
              i +
              ")'>" +
              "<nobr>" +
              tabTitle +
              "</nobr>" +
              "</button>" +
              "</div>";
        } else {
          tabs_string +=
              "<div class='tab-item'>" +
              "<button class='tab-title-button' onclick='window.globalFunction.switch_tab(" +
              i +
              ")'>" +
              "<nobr>" +
              tabTitle +
              "</nobr>" +
              "</button>" +
              "<button class='tab-close-button' onclick='window.globalFunction.remove_tab(" +
              i +
              ")'>×</button>" +
              "</div>";
        }
      }
      tab_element.innerHTML = tabs_string;
      tab_element.style.visibility = "visible";
      tab_element.style.opacity = "1";
      tab_element.style.transition = "opacity 0.3s ";
    } else {
      tabs_shown = 0;
      
      // 下部ツールバーを通常表示に戻す
      document.getElementById("menu_toolbar").style.display = "none";
      document.getElementById("normal_toolbar").style.display = "block";
      
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

  // タブの再描画部分を修正（追加ボタンは削除）
  let tabs_string = "";
  const closeButtonPosition = localStorage.getItem("tab_close_button_position") || "left";
  
  for (let i = 0; i < tabs.length; i++) {
    // タイトルの参照方法を修正
    const tabTitle = tabs[i].title[tabs[i].page_number] || "New tab";
    
    if (closeButtonPosition === "left") {
      tabs_string +=
        "<div class='tab-item'>" +
        "<button class='tab-close-button' onclick='window.globalFunction.remove_tab(" +
        i +
        ")'>×</button>" +
        "<button class='tab-title-button' onclick='window.globalFunction.switch_tab(" +
        i +
        ")'>" +
        "<nobr>" +
        tabTitle +
        "</nobr>" +
        "</button>" +
        "</div>";
    } else {
      tabs_string +=
        "<div class='tab-item'>" +
        "<button class='tab-title-button' onclick='window.globalFunction.switch_tab(" +
        i +
        ")'>" +
        "<nobr>" +
        tabTitle +
        "</nobr>" +
        "</button>" +
        "<button class='tab-close-button' onclick='window.globalFunction.remove_tab(" +
        i +
        ")'>×</button>" +
        "</div>";
    }
  }
  tab_element.innerHTML = tabs_string;

  save_status();
} 