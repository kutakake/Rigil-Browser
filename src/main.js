const { invoke } = window.__TAURI__.core;

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
  return await invoke("greet", { name: greetInputEl.value });
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

function show_hide_tabs() {
  try {
    if (tabs_shown == 0) {
      tabs_shown = 1;
      
      // 下部ツールバーをメニュー表示用に切り替え
      document.getElementById("normal_toolbar").style.display = "none";
      document.getElementById("menu_toolbar").style.display = "block";
      
      // タブメニューの内容を生成（追加ボタンは削除）
      let tabs_string = "";
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

window.globalFunction = [];
window.globalFunction.greet = greet;
window.globalFunction.reflesh_page = reflesh_page;
window.globalFunction.show_hide_tabs = show_hide_tabs;
window.globalFunction.switch_tab = switch_tab;
window.globalFunction.add_tab = add_tab;
window.globalFunction.remove_tab = remove_tab;
window.globalFunction.open_settings = open_settings;
window.globalFunction.close_settings = close_settings;
window.globalFunction.clear_history = clear_history;
window.globalFunction.clear_cache = clear_cache;
window.globalFunction.reset_theme = reset_theme;

// 設定画面の機能
function open_settings() {
  const settingsScreen = document.getElementById("settings_screen");
  settingsScreen.style.display = "flex";
  
  // 設定値を読み込み
  load_settings();
  
  // フォントサイズスライダーのイベントリスナーを再設定
  const fontSizeSlider = document.getElementById("font_size_slider");
  if (fontSizeSlider) {
    // 既存のイベントリスナーを削除してから新しく追加
    fontSizeSlider.removeEventListener("input", handleFontSizeChange);
    fontSizeSlider.addEventListener("input", handleFontSizeChange);
  }
  
  // メニューを閉じる
  if (tabs_shown == 1) {
    show_hide_tabs();
  }
}

// フォントサイズ変更のハンドラー関数
function handleFontSizeChange() {
  console.log("フォントサイズ変更:", this.value);
  const fontSizeValue = document.getElementById("font_size_value");
  if (fontSizeValue) {
    fontSizeValue.textContent = this.value + "px";
    console.log("表示更新:", this.value + "px");
  }
  save_settings();
}

function close_settings() {
  const settingsScreen = document.getElementById("settings_screen");
  settingsScreen.style.display = "none";
}

function load_settings() {
  // テーマプリセット設定
  const themePreset = localStorage.getItem("theme_preset") || "auto";
  document.getElementById("theme_preset").value = themePreset;
  
  // カスタムカラー設定
  const baseColor = localStorage.getItem("base_color") || "#f6f6f6";
  const accentColor = localStorage.getItem("accent_color") || "#4CAF50";
  const textColor = localStorage.getItem("text_color") || "#0f0f0f";
  
  document.getElementById("base_color").value = baseColor;
  document.getElementById("base_color_text").value = baseColor;
  document.getElementById("accent_color").value = accentColor;
  document.getElementById("accent_color_text").value = accentColor;
  document.getElementById("text_color").value = textColor;
  document.getElementById("text_color_text").value = textColor;
  
  // フォントサイズ設定
  const fontSize = localStorage.getItem("font_size") || "16";
  document.getElementById("font_size_slider").value = fontSize;
  document.getElementById("font_size_value").textContent = fontSize + "px";
  
  // タブ自動保存設定
  const autoSaveTabs = localStorage.getItem("auto_save_tabs") === "true";
  document.getElementById("auto_save_tabs").checked = autoSaveTabs;
  
  // 画像表示設定
  const showImages = localStorage.getItem("show_images") !== "false";
  document.getElementById("show_images").checked = showImages;
  
  // カラー設定の表示/非表示を制御
  toggle_color_settings();
}

function save_settings() {
  // テーマプリセット設定
  const themePreset = document.getElementById("theme_preset").value;
  localStorage.setItem("theme_preset", themePreset);
  
  // カスタムカラー設定
  const baseColor = document.getElementById("base_color").value;
  const accentColor = document.getElementById("accent_color").value;
  const textColor = document.getElementById("text_color").value;
  
  localStorage.setItem("base_color", baseColor);
  localStorage.setItem("accent_color", accentColor);
  localStorage.setItem("text_color", textColor);
  
  // テキスト入力も同期
  document.getElementById("base_color_text").value = baseColor;
  document.getElementById("accent_color_text").value = accentColor;
  document.getElementById("text_color_text").value = textColor;
  
  // フォントサイズ設定
  const fontSize = document.getElementById("font_size_slider").value;
  localStorage.setItem("font_size", fontSize);
  apply_font_size(fontSize);
  
  // タブ自動保存設定
  const autoSaveTabs = document.getElementById("auto_save_tabs").checked;
  localStorage.setItem("auto_save_tabs", autoSaveTabs);
  
  // 画像表示設定
  const showImages = document.getElementById("show_images").checked;
  localStorage.setItem("show_images", showImages);
  
  // テーマを適用
  apply_theme(themePreset, baseColor, accentColor, textColor);
  
  // カラー設定の表示/非表示を制御
  toggle_color_settings();
}

function toggle_color_settings() {
  const themePreset = document.getElementById("theme_preset").value;
  const colorSettings = document.querySelector(".color_settings");
  
  if (themePreset === "custom") {
    colorSettings.style.display = "block";
  } else {
    colorSettings.style.display = "none";
  }
}

function apply_theme(preset, baseColor, accentColor, textColor) {
  const root = document.documentElement;
  
  if (preset === "custom") {
    // カスタムテーマを適用
    root.style.setProperty('--base-color', baseColor);
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--text-color', textColor);
    
    // 明度を計算してボタンのホバー色を生成
    const accentHover = adjustBrightness(accentColor, -20);
    const accentActive = adjustBrightness(accentColor, -40);
    const toolbarColor = adjustBrightness(baseColor, 15); // ベースより15%明るく
    
    root.style.setProperty('--accent-hover', accentHover);
    root.style.setProperty('--accent-active', accentActive);
    root.style.setProperty('--toolbar-color', toolbarColor);
    
    // htmlとbodyの両方に背景色と文字色を適用
    root.style.backgroundColor = baseColor;
    root.style.color = textColor;
    document.body.style.backgroundColor = baseColor;
    document.body.style.color = textColor;
    
    // ツールバーの背景色を明るく設定
    const toolbar = document.getElementById("bottom_toolbar");
    if (toolbar) {
      toolbar.style.backgroundColor = toolbarColor;
      toolbar.style.borderTopColor = adjustBrightness(toolbarColor, -20);
    }
    
    // タブ画面の背景色も変更
    const tabsElement = document.getElementById("tabs");
    if (tabsElement) {
      tabsElement.style.backgroundColor = baseColor;
    }
    
    // UIボタンにアクセントカラーを適用
    applyAccentColorToButtons(accentColor, accentHover, accentActive);
    
    root.style.colorScheme = "light";
  } else if (preset === "light") {
    // ライトテーマ
    resetCustomStyles();
    root.style.colorScheme = "light";
  } else if (preset === "dark") {
    // ダークテーマ
    resetCustomStyles();
    root.style.colorScheme = "dark";
  } else {
    // 自動テーマ
    resetCustomStyles();
    root.style.colorScheme = "auto";
  }
}

function applyAccentColorToButtons(accentColor, accentHover, accentActive) {
  // 新しいタブボタン
  const addTabButton = document.getElementById("add_tab_button");
  if (addTabButton) {
    addTabButton.style.backgroundColor = accentColor;
    addTabButton.style.borderColor = accentColor;
  }
  
  // 設定ボタン
  const settingsButton = document.getElementById("settings_button");
  if (settingsButton) {
    settingsButton.style.backgroundColor = adjustBrightness(accentColor, -30);
    settingsButton.style.borderColor = adjustBrightness(accentColor, -30);
  }
  
  // メニューボタンと更新ボタン
  const menuButtons = document.querySelectorAll("#head_contents button, #menu_toolbar button:first-child");
  menuButtons.forEach(button => {
    if (button.id !== "add_tab_button" && button.id !== "settings_button") {
      button.style.backgroundColor = adjustBrightness(accentColor, -20);
      button.style.borderColor = adjustBrightness(accentColor, -20);
      button.style.color = "white";
    }
  });
  
  // フォームのsubmitボタンなど
  const formButtons = document.querySelectorAll("button[type='submit'], .reset_button");
  formButtons.forEach(button => {
    button.style.backgroundColor = accentColor;
    button.style.borderColor = accentColor;
    button.style.color = "white";
  });
}

function resetCustomStyles() {
  const root = document.documentElement;
  const properties = ['--base-color', '--accent-color', '--text-color', '--accent-hover', '--accent-active', '--toolbar-color'];
  
  properties.forEach(prop => {
    root.style.removeProperty(prop);
  });
  
  // htmlとbodyの背景色と文字色をリセット
  root.style.removeProperty('background-color');
  root.style.removeProperty('color');
  document.body.style.removeProperty('background-color');
  document.body.style.removeProperty('color');
  
  // ツールバーの背景色をリセット
  const toolbar = document.getElementById("bottom_toolbar");
  if (toolbar) {
    toolbar.style.removeProperty('background-color');
    toolbar.style.removeProperty('border-top-color');
  }
  
  // タブ画面の背景色をリセット
  const tabsElement = document.getElementById("tabs");
  if (tabsElement) {
    tabsElement.style.removeProperty('background-color');
  }
  
  // ボタンのカスタムスタイルをリセット
  resetButtonStyles();
}

function resetButtonStyles() {
  // 全てのボタンのカスタムスタイルをリセット
  const allButtons = document.querySelectorAll("button");
  allButtons.forEach(button => {
    button.style.removeProperty('background-color');
    button.style.removeProperty('border-color');
    button.style.removeProperty('color');
  });
}

function adjustBrightness(hex, percent) {
  // HEXカラーの明度を調整する関数
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function isValidHexColor(hex) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

function sync_color_inputs(colorInput, textInput) {
  const color = colorInput.value;
  textInput.value = color;
  save_settings();
}

function sync_text_inputs(textInput, colorInput) {
  const text = textInput.value;
  if (isValidHexColor(text)) {
    colorInput.value = text;
    save_settings();
  }
}

function reset_theme() {
  if (confirm("テーマをデフォルトに戻しますか？")) {
    // デフォルト値に設定
    document.getElementById("theme_preset").value = "auto";
    document.getElementById("base_color").value = "#f6f6f6";
    document.getElementById("base_color_text").value = "#f6f6f6";
    document.getElementById("accent_color").value = "#4CAF50";
    document.getElementById("accent_color_text").value = "#4CAF50";
    document.getElementById("text_color").value = "#0f0f0f";
    document.getElementById("text_color_text").value = "#0f0f0f";
    
    save_settings();
  }
}

function apply_font_size(fontSize) {
  document.documentElement.style.setProperty('--content-font-size', fontSize + 'px');
}

function clear_history() {
  if (confirm("履歴をクリアしますか？この操作は元に戻せません。")) {
    // 全タブの履歴をクリア
    tabs.forEach(tab => {
      tab.title = ["New tab"];
      tab.urls = ["rigil:newtab"];
      tab.contents = ["New tab"];
      tab.page_number = ["0"];
    });
    
    // 現在のタブ状態をリセット
    current_page_number = 0;
    current_page_url = "rigil:newtab";
    tab_history = ["New tab"];
    url_history = ["rigil:newtab"];
    
    // 画面を更新
    body_element.innerHTML = "New tab";
    document.getElementById("greet-input").value = "rigil:newtab";
    
    save_status();
    alert("履歴がクリアされました。");
  }
}

function clear_cache() {
  if (confirm("キャッシュをクリアしますか？")) {
    // 設定情報を保持するためのバックアップ
    const themePreset = localStorage.getItem("theme_preset");
    const baseColor = localStorage.getItem("base_color");
    const accentColor = localStorage.getItem("accent_color");
    const textColor = localStorage.getItem("text_color");
    const fontSize = localStorage.getItem("font_size");
    const autoSaveTabs = localStorage.getItem("auto_save_tabs");
    const showImages = localStorage.getItem("show_images");
    
    // localStorageをクリア
    localStorage.clear();
    
    // 設定を復元
    if (themePreset) localStorage.setItem("theme_preset", themePreset);
    if (baseColor) localStorage.setItem("base_color", baseColor);
    if (accentColor) localStorage.setItem("accent_color", accentColor);
    if (textColor) localStorage.setItem("text_color", textColor);
    if (fontSize) localStorage.setItem("font_size", fontSize);
    if (autoSaveTabs) localStorage.setItem("auto_save_tabs", autoSaveTabs);
    if (showImages) localStorage.setItem("show_images", showImages);
    
    // タブ情報をリセット
    tabs = [newtab];
    current_tab_number = 0;
    current_page_number = 0;
    tab_history = ["New tab"];
    url_history = ["rigil:newtab"];
    
    // 画面を更新
    body_element.innerHTML = "New tab";
    document.getElementById("greet-input").value = "rigil:newtab";
    
    // ファイルに保存
    save_status();
    
    alert("キャッシュがクリアされました。");
  }
}

// 設定画面のイベントリスナーを設定
document.addEventListener("DOMContentLoaded", async function() {
  // アプリの初期化
  await initialize_app();
  
  // イベントリスナーの設定
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

  // マウスイベントリスナー
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
  
  // テーマプリセット変更
  const themePreset = document.getElementById("theme_preset");
  if (themePreset) {
    themePreset.addEventListener("change", save_settings);
  }
  
  // カラーピッカーの変更
  const baseColorPicker = document.getElementById("base_color");
  const baseColorText = document.getElementById("base_color_text");
  if (baseColorPicker && baseColorText) {
    baseColorPicker.addEventListener("change", () => sync_color_inputs(baseColorPicker, baseColorText));
    baseColorText.addEventListener("input", () => sync_text_inputs(baseColorText, baseColorPicker));
  }
  
  const accentColorPicker = document.getElementById("accent_color");
  const accentColorText = document.getElementById("accent_color_text");
  if (accentColorPicker && accentColorText) {
    accentColorPicker.addEventListener("change", () => sync_color_inputs(accentColorPicker, accentColorText));
    accentColorText.addEventListener("input", () => sync_text_inputs(accentColorText, accentColorPicker));
  }
  
  const textColorPicker = document.getElementById("text_color");
  const textColorTextInput = document.getElementById("text_color_text");
  if (textColorPicker && textColorTextInput) {
    textColorPicker.addEventListener("change", () => sync_color_inputs(textColorPicker, textColorTextInput));
    textColorTextInput.addEventListener("input", () => sync_text_inputs(textColorTextInput, textColorPicker));
  }
  
  // フォントサイズ変更
  const fontSizeSlider = document.getElementById("font_size_slider");
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener("input", handleFontSizeChange);
  }
  
  // チェックボックス変更
  const autoSaveCheckbox = document.getElementById("auto_save_tabs");
  if (autoSaveCheckbox) {
    autoSaveCheckbox.addEventListener("change", save_settings);
  }
  
  const showImagesCheckbox = document.getElementById("show_images");
  if (showImagesCheckbox) {
    showImagesCheckbox.addEventListener("change", save_settings);
  }
  
  // 設定画面の背景クリックで閉じる
  const settingsScreen = document.getElementById("settings_screen");
  if (settingsScreen) {
    settingsScreen.addEventListener("click", function(e) {
      if (e.target === settingsScreen) {
        close_settings();
      }
    });
  }
  
  // アプリ起動時の設定適用
  initialize_app_settings();
});

// アプリ起動時の設定初期化関数
function initialize_app_settings() {
  // 保存された設定を読み込み、デフォルト値を設定
  const savedThemePreset = localStorage.getItem("theme_preset") || "auto";
  const savedBaseColor = localStorage.getItem("base_color") || "#f6f6f6";
  const savedAccentColor = localStorage.getItem("accent_color") || "#4CAF50";
  const savedTextColor = localStorage.getItem("text_color") || "#0f0f0f";
  const savedFontSize = localStorage.getItem("font_size") || "16";
  
  // テーマとフォントサイズを適用
  apply_theme(savedThemePreset, savedBaseColor, savedAccentColor, savedTextColor);
  apply_font_size(savedFontSize);
  
  // URLバーの初期化
  if (url_history && url_history[current_page_number]) {
    current_page_url = url_history[current_page_number];
    const greetInput = document.getElementById("greet-input");
    if (greetInput) {
      greetInput.value = current_page_url;
    }
  }
  
  console.log("アプリ設定を初期化しました:", {
    theme: savedThemePreset,
    fontSize: savedFontSize + "px",
    currentUrl: current_page_url
  });
}