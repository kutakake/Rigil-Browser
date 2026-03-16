// 設定画面とテーマ機能

// ==================== 共通ヘルパー関数 ====================

// DOM 要素を安全に取得
function getElementByIdSafe(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element not found: ${id}`);
  }
  return element;
}

// 要素の値を取得
function getElementValue(id) {
  const element = getElementByIdSafe(id);
  return element ? (element.value ?? element.checked) : null;
}

// 要素の値を設定
function setElementValue(id, value) {
  const element = getElementByIdSafe(id);
  if (element !== null) {
    if (element.type === 'checkbox') {
      element.checked = value;
    } else {
      element.value = value;
    }
  }
}

// localStorage から設定値を取得（デフォルト値付き）
function getSettingValue(key, defaultValue) {
  const stored = localStorage.getItem(key);
  return stored !== null ? stored : defaultValue;
}

// localStorage に設定値を保存
function setSettingValue(key, value) {
  localStorage.setItem(key, value);
}

// チェックボックスの設定をロード
function loadCheckboxSetting(id, defaultValue) {
  const checkbox = getElementByIdSafe(id);
  if (checkbox !== null) {
    const storedValue = getSettingValue(id, String(defaultValue));
    checkbox.checked = storedValue === 'true';
  }
}

// チェックボックスの設定をセーブ
function saveCheckboxSetting(id) {
  const checkbox = getElementByIdSafe(id);
  if (checkbox !== null) {
    setSettingValue(id, String(checkbox.checked));
  }
}

// カラー設定をロード
function loadColorSettings() {
  const colors = [
    { key: 'base_color', default: '#f6f6f6' },
    { key: 'accent_color', default: '#4CAF50' },
    { key: 'text_color', default: '#0f0f0f' },
    { key: 'link_color', default: '#646cff' }
  ];
  
  colors.forEach(color => {
    const value = getSettingValue(color.key, color.default);
    setElementValue(`${color.key}`, value);
    setElementValue(`${color.key}_text`, value);
  });
}

// カラー設定をセーブ
function saveColorSettings() {
  const colors = ['base_color', 'accent_color', 'text_color', 'link_color'];
  
  colors.forEach(color => {
    const pickerElement = getElementByIdSafe(color);
    if (pickerElement !== null) {
      const value = pickerElement.value;
      setSettingValue(color, value);
      // テキスト入力も同期
      const textElement = getElementByIdSafe(`${color}_text`);
      if (textElement !== null) {
        textElement.value = value;
      }
    }
  });
}

// ==================== 設定画面の機能 ====================

function open_settings() {
  const settingsScreen = document.getElementById("settings_screen");
  settingsScreen.style.display = "flex";
  
  // 設定値を読み込み
  load_settings();
  
  // 現在のテーマを設定画面に適用
  const currentTheme = localStorage.getItem("theme_preset") || "auto";
  const currentBaseColor = localStorage.getItem("base_color") || "#f6f6f6";
  const currentAccentColor = localStorage.getItem("accent_color") || "#4CAF50";
  const currentTextColor = localStorage.getItem("text_color") || "#0f0f0f";
  
  if (currentTheme === "custom") {
    const currentLinkColor = localStorage.getItem("link_color") || "#646cff";
    applyThemeToSettings(currentBaseColor, currentAccentColor, currentTextColor, currentLinkColor);
  }
  
  // フォントサイズスライダーのイベントリスナーを再設定
  const fontSizeSlider = document.getElementById("font_size_slider");
  if (fontSizeSlider) {
    // 既存のイベントリスナーを削除してから新しく追加
    fontSizeSlider.removeEventListener("input", handleFontSizeChange);
    fontSizeSlider.addEventListener("input", handleFontSizeChange);
  }
  
  // プロキシ設定のイベントリスナーを設定
  const useProxyCheckbox = document.getElementById("use_proxy");
  if (useProxyCheckbox) {
    useProxyCheckbox.addEventListener("change", function() {
      toggle_proxy_settings();
      save_settings();
    });
  }
  
  const proxyUrlInput = document.getElementById("proxy_url");
  if (proxyUrlInput) {
    proxyUrlInput.addEventListener("input", function() {
      save_settings();
    });
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
  const themePreset = getSettingValue("theme_preset", "auto");
  setElementValue("theme_preset", themePreset);
  
  // カスタムカラー設定をロード
  loadColorSettings();
  
  // フォントサイズ設定
  const fontSize = getSettingValue("font_size", "16");
  setElementValue("font_size_slider", fontSize);
  const fontSizeValueEl = document.getElementById("font_size_value");
  if (fontSizeValueEl) {
    fontSizeValueEl.textContent = fontSize + "px";
  }
  
  // 言語設定
  const languageSelect = getElementByIdSafe("language_select");
  if (languageSelect && window.i18n) {
    languageSelect.value = window.i18n.getCurrentLanguage();
  }
  
  // チェックボックス設定をロード
  loadCheckboxSetting("auto_save_tabs", false);
  loadCheckboxSetting("show_images", true);
  
  // タブの閉じるボタンの位置設定
  const tabCloseButtonPosition = getSettingValue("tab_close_button_position", "left");
  setElementValue("tab_close_button_position", tabCloseButtonPosition);
  
  // プロキシ設定をロード
  loadCheckboxSetting("use_proxy", false);
  const proxyUrl = getSettingValue("proxy_url", "http://127.0.0.1:8080");
  setElementValue("proxy_url", proxyUrl);
  
  // プロキシ設定の表示/非表示を制御
  toggle_proxy_settings();
  
  // カラー設定の表示/非表示を制御
  toggle_color_settings();
}

function save_settings() {
  // テーマプリセット設定
  const themePreset = getElementValue("theme_preset");
  setSettingValue("theme_preset", themePreset);
  
  // カスタムカラー設定をセーブ
  saveColorSettings();
  
  // フォントサイズ設定
  const fontSize = getElementValue("font_size_slider");
  setSettingValue("font_size", fontSize);
  apply_font_size(fontSize);
  
  // チェックボックス設定をセーブ
  saveCheckboxSetting("auto_save_tabs");
  saveCheckboxSetting("show_images");
  
  // タブの閉じるボタンの位置設定
  const tabCloseButtonPosition = getElementValue("tab_close_button_position");
  setSettingValue("tab_close_button_position", tabCloseButtonPosition);
  
  // プロキシ設定をセーブ
  saveCheckboxSetting("use_proxy");
  const proxyUrl = getElementValue("proxy_url");
  setSettingValue("proxy_url", proxyUrl);
  
  // プロキシ設定の表示/非表示を制御
  toggle_proxy_settings();
  
  // カラー値を取得
  const baseColor = localStorage.getItem("base_color") || "#f6f6f6";
  const accentColor = localStorage.getItem("accent_color") || "#4CAF50";
  const textColor = localStorage.getItem("text_color") || "#0f0f0f";
  
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
    
    // 設定画面にカスタムテーマを適用
    applyThemeToSettings(baseColor, accentColor, textColor, linkColor);
    
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

function applyThemeToSettings(baseColor, accentColor, textColor, linkColor) {
  // 設定画面の背景オーバーレイ
  const settingsScreen = document.getElementById("settings_screen");
  if (settingsScreen) {
    // ベースカラーが暗い場合は明るいオーバーレイ、明るい場合は暗いオーバーレイ
    const brightness = getBrightness(baseColor);
    const overlayColor = brightness > 128 ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.3)";
    settingsScreen.style.backgroundColor = overlayColor;
  }
  
  // 設定画面のコンテナ
  const settingsContainer = document.querySelector(".settings_container");
  if (settingsContainer) {
    settingsContainer.style.backgroundColor = baseColor;
    settingsContainer.style.color = textColor;
  }
  
  // 設定画面のヘッダー
  const settingsHeader = document.querySelector(".settings_header");
  if (settingsHeader) {
    const headerBorderColor = adjustBrightness(baseColor, -20);
    settingsHeader.style.borderBottomColor = headerBorderColor;
  }
  
  // 設定画面のタイトル
  const settingsTitle = document.querySelector(".settings_header h2");
  if (settingsTitle) {
    settingsTitle.style.color = textColor;
  }
  
  // 閉じるボタン
  const closeButton = document.querySelector(".close_button");
  if (closeButton) {
    closeButton.style.backgroundColor = adjustBrightness(accentColor, -40);
    closeButton.style.color = "white";
    closeButton.style.borderColor = adjustBrightness(accentColor, -40);
  }
  
  // セクションタイトル
  const sectionTitles = document.querySelectorAll(".settings_section h3");
  sectionTitles.forEach(title => {
    title.style.color = textColor;
    title.style.borderBottomColor = accentColor;
  });
  
  // ラベル
  const labels = document.querySelectorAll(".setting_item label");
  labels.forEach(label => {
    label.style.color = adjustBrightness(textColor, -10);
  });
  
  // セレクトボックス
  const selects = document.querySelectorAll(".setting_item select");
  selects.forEach(select => {
    select.style.backgroundColor = adjustBrightness(baseColor, 10);
    select.style.color = textColor;
    select.style.borderColor = adjustBrightness(baseColor, -30);
  });
  
  // テキスト入力
  const textInputs = document.querySelectorAll(".color_input_group input[type='text']");
  textInputs.forEach(input => {
    input.style.backgroundColor = adjustBrightness(baseColor, 10);
    input.style.color = textColor;
    input.style.borderColor = adjustBrightness(baseColor, -30);
  });
  
  // カラー設定エリア
  const colorSettings = document.querySelector(".color_settings");
  if (colorSettings) {
    colorSettings.style.backgroundColor = adjustBrightness(baseColor, 5);
    colorSettings.style.borderColor = adjustBrightness(baseColor, -20);
  }
  
  // リセットボタン
  const resetButtons = document.querySelectorAll(".reset_button");
  resetButtons.forEach(button => {
    button.style.backgroundColor = adjustBrightness(accentColor, -30);
    button.style.color = "white";
    button.style.borderColor = adjustBrightness(accentColor, -30);
  });
  
  // 危険なボタン（履歴クリアなど）
  const dangerButtons = document.querySelectorAll(".danger_button");
  dangerButtons.forEach(button => {
    // ユーザー指定のアクセントカラーを使用
    button.style.backgroundColor = adjustBrightness(accentColor, -40);
    button.style.color = "white";
    button.style.borderColor = adjustBrightness(accentColor, -40);
  });
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
  
  // 設定画面のスタイルをリセット
  resetSettingsStyles();
  
  // ボタンのカスタムスタイルをリセット
  resetButtonStyles();
}

function resetSettingsStyles() {
  // 設定画面の背景オーバーレイをリセット
  const settingsScreen = document.getElementById("settings_screen");
  if (settingsScreen) {
    settingsScreen.style.removeProperty('background-color');
  }
  
  // 設定画面のスタイルをリセット
  const settingsContainer = document.querySelector(".settings_container");
  if (settingsContainer) {
    settingsContainer.style.removeProperty('background-color');
    settingsContainer.style.removeProperty('color');
  }
  
  // 設定画面のヘッダー
  const settingsHeader = document.querySelector(".settings_header");
  if (settingsHeader) {
    settingsHeader.style.removeProperty('border-bottom-color');
  }
  
  // 設定画面のタイトル
  const settingsTitle = document.querySelector(".settings_header h2");
  if (settingsTitle) {
    settingsTitle.style.removeProperty('color');
  }
  
  // 閉じるボタン
  const closeButton = document.querySelector(".close_button");
  if (closeButton) {
    closeButton.style.removeProperty('background-color');
    closeButton.style.removeProperty('color');
    closeButton.style.removeProperty('border-color');
  }
  
  // セクションタイトル
  const sectionTitles = document.querySelectorAll(".settings_section h3");
  sectionTitles.forEach(title => {
    title.style.removeProperty('color');
    title.style.removeProperty('border-bottom-color');
  });
  
  // ラベル
  const labels = document.querySelectorAll(".setting_item label");
  labels.forEach(label => {
    label.style.removeProperty('color');
  });
  
  // セレクトボックス
  const selects = document.querySelectorAll(".setting_item select");
  selects.forEach(select => {
    select.style.removeProperty('background-color');
    select.style.removeProperty('color');
    select.style.removeProperty('border-color');
  });
  
  // テキスト入力
  const textInputs = document.querySelectorAll(".color_input_group input[type='text']");
  textInputs.forEach(input => {
    input.style.removeProperty('background-color');
    input.style.removeProperty('color');
    input.style.removeProperty('border-color');
  });
  
  // カラー設定エリア
  const colorSettings = document.querySelector(".color_settings");
  if (colorSettings) {
    colorSettings.style.removeProperty('background-color');
    colorSettings.style.removeProperty('border-color');
  }
  
  // リセットボタン
  const resetButtons = document.querySelectorAll(".reset_button");
  resetButtons.forEach(button => {
    button.style.removeProperty('background-color');
    button.style.removeProperty('color');
    button.style.removeProperty('border-color');
  });
  
  // 危険なボタン（履歴クリアなど）
  const dangerButtons = document.querySelectorAll(".danger_button");
  dangerButtons.forEach(button => {
    // ユーザー指定のアクセントカラーを使用
    button.style.removeProperty('background-color');
    button.style.removeProperty('color');
    button.style.removeProperty('border-color');
  });
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

function getBrightness(hex) {
  // HEXカラーの明度を計算する関数（0-255）
  const num = parseInt(hex.replace("#", ""), 16);
  const R = (num >> 16);
  const G = (num >> 8 & 0x00FF);
  const B = (num & 0x0000FF);
  
  // 人間の目の感度に基づいた明度計算
  return (R * 0.299 + G * 0.587 + B * 0.114);
}

function isValidHexColor(hex) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

// カラーインプットの同期処理
// colorPicker: input[type='color'], textInput: input[type='text']
function sync_color_inputs(colorPicker, textInput) {
  const color = colorPicker.value;
  if (textInput) {
    textInput.value = color;
  }
  save_settings();
}

// テキストインプットからカラーピッカーへの同期
function sync_text_inputs(textInput, colorPicker) {
  const text = textInput.value;
  if (isValidHexColor(text)) {
    if (colorPicker) {
      colorPicker.value = text;
    }
    save_settings();
  } else {
    console.warn('無効な HEX カラー:', text);
  }
}

function reset_theme() {
  if (confirm(window.i18n.t("confirm_reset_theme"))) {
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
    
    // タブの閉じるボタンの位置設定もリセット
    const tabCloseButtonSelect = document.getElementById("tab_close_button_position");
    if (tabCloseButtonSelect) {
      tabCloseButtonSelect.value = "left";
    }
    
    save_settings();
  }
}

function apply_font_size(fontSize) {
  document.documentElement.style.setProperty('--content-font-size', fontSize + 'px');
}

function clear_history() {
  if (confirm(window.i18n.t("confirm_clear_history"))) {
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
    alert(window.i18n.t("history_cleared"));
  }
}

function clear_cache() {
  if (confirm(window.i18n.t("confirm_clear_cache"))) {
    // 設定情報を保持するためのバックアップ
    const themePreset = localStorage.getItem("theme_preset");
    const baseColor = localStorage.getItem("base_color");
    const accentColor = localStorage.getItem("accent_color");
    const textColor = localStorage.getItem("text_color");
    const linkColor = localStorage.getItem("link_color");
    const fontSize = localStorage.getItem("font_size");
    const autoSaveTabs = localStorage.getItem("auto_save_tabs");
    const showImages = localStorage.getItem("show_images");
    const language = localStorage.getItem("rigil_language");
    const tabCloseButtonPosition = localStorage.getItem("tab_close_button_position");
    
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
    if (language) localStorage.setItem("rigil_language", language);
    if (tabCloseButtonPosition) localStorage.setItem("tab_close_button_position", tabCloseButtonPosition);
    
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
    
    alert(window.i18n.t("cache_cleared"));
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
  
  // タブの閉じるボタンの位置設定のデフォルト値を設定
  const savedTabCloseButtonPosition = localStorage.getItem("tab_close_button_position") || "left";
  localStorage.setItem("tab_close_button_position", savedTabCloseButtonPosition);
  
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

// 言語切り替え関数
function change_language(language) {
  if (window.i18n) {
    window.i18n.setLanguage(language);
    localStorage.setItem("language", language);
  }
}

// プロキシ設定の表示/非表示を制御
function toggle_proxy_settings() {
  const useProxyCheckbox = document.getElementById("use_proxy");
  const proxyUrlSetting = document.getElementById("proxy_url_setting");
  const proxyStatus = document.getElementById("proxy_status");
  
  if (useProxyCheckbox && proxyUrlSetting && proxyStatus) {
    if (useProxyCheckbox.checked) {
      proxyUrlSetting.style.display = "block";
      proxyStatus.style.display = "block";
    } else {
      proxyUrlSetting.style.display = "none";
      proxyStatus.style.display = "none";
    }
  }
}

// プロキシ接続テスト
async function test_proxy_connection() {
  const proxyUrl = localStorage.getItem("proxy_url") || "http://127.0.0.1:8080";
  const statusText = document.getElementById("proxy_status_text");
  const testButton = document.getElementById("test_proxy_button");
  
  if (statusText) {
    statusText.textContent = "接続中...";
    statusText.style.color = "#666";
  }
  
  if (testButton) {
    testButton.disabled = true;
    testButton.textContent = "テスト中...";
  }
  
  try {
    // プロキシサーバーの生存確認
    const response = await fetch(proxyUrl, {
      method: 'GET',
      mode: 'cors',
      timeout: 5000
    });
    
    if (response.ok) {
      if (statusText) {
        statusText.textContent = "接続成功";
        statusText.style.color = "#4CAF50";
      }
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error("プロキシ接続テストエラー:", error);
    if (statusText) {
      statusText.textContent = "接続失敗";
      statusText.style.color = "#f44336";
    }
  } finally {
    if (testButton) {
      testButton.disabled = false;
      testButton.textContent = "接続テスト";
    }
  }
}

// プロキシ経由でページを取得
async function get_page_via_proxy(url) {
  const proxyUrl = localStorage.getItem("proxy_url") || "http://127.0.0.1:8080";
  
  try {
    const response = await fetch(`${proxyUrl}/api/process?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    } else {
      throw new Error(data.error || "プロキシからの応答が無効です");
    }
  } catch (error) {
    console.error("プロキシ経由でのページ取得エラー:", error);
    throw error;
  }
} 