// 設定画面とテーマ機能

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
  const linkColor = localStorage.getItem("link_color") || "#646cff";
  
  document.getElementById("base_color").value = baseColor;
  document.getElementById("base_color_text").value = baseColor;
  document.getElementById("accent_color").value = accentColor;
  document.getElementById("accent_color_text").value = accentColor;
  document.getElementById("text_color").value = textColor;
  document.getElementById("text_color_text").value = textColor;
  document.getElementById("link_color").value = linkColor;
  document.getElementById("link_color_text").value = linkColor;
  
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
  const linkColor = document.getElementById("link_color").value;
  
  localStorage.setItem("base_color", baseColor);
  localStorage.setItem("accent_color", accentColor);
  localStorage.setItem("text_color", textColor);
  localStorage.setItem("link_color", linkColor);
  
  // テキスト入力も同期
  document.getElementById("base_color_text").value = baseColor;
  document.getElementById("accent_color_text").value = accentColor;
  document.getElementById("text_color_text").value = textColor;
  document.getElementById("link_color_text").value = linkColor;
  
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
    const linkColor = localStorage.getItem("link_color") || "#646cff";
    
    // カスタムテーマを適用
    root.style.setProperty('--base-color', baseColor);
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--text-color', textColor);
    root.style.setProperty('--link-color', linkColor);
    
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
  const properties = ['--base-color', '--accent-color', '--text-color', '--link-color', '--accent-hover', '--accent-active', '--toolbar-color'];
  
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
    document.getElementById("link_color").value = "#646cff";
    document.getElementById("link_color_text").value = "#646cff";
    
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
    const linkColor = localStorage.getItem("link_color");
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
    if (linkColor) localStorage.setItem("link_color", linkColor);
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

// アプリ起動時の設定初期化関数
function initialize_app_settings() {
  // 保存された設定を読み込み、デフォルト値を設定
  const savedThemePreset = localStorage.getItem("theme_preset") || "auto";
  const savedBaseColor = localStorage.getItem("base_color") || "#f6f6f6";
  const savedAccentColor = localStorage.getItem("accent_color") || "#4CAF50";
  const savedTextColor = localStorage.getItem("text_color") || "#0f0f0f";
  const savedLinkColor = localStorage.getItem("link_color") || "#646cff";
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