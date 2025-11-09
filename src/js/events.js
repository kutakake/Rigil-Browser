// イベントリスナーとグローバル関数の設定

// DOMContentLoadedイベントリスナー
document.addEventListener("DOMContentLoaded", async function() {
  // グローバル関数の設定（他のファイルが読み込まれた後に実行）
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
  window.globalFunction.change_language = change_language;
  window.globalFunction.test_proxy_connection = test_proxy_connection;
  window.globalFunction.get_page_via_proxy = get_page_via_proxy;
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
  /*
  new AndroidBackPressedController().setListener(async () => {
    await navigateHistory(-1);
    return false;
  });
  */
  /*
  window.addEventListener("ionBackButton", async (e) => {
    await navigateHistory(-1);
  });
  */

  // 設定画面のイベントリスナーを設定
  setupSettingsEventListeners();

  // アプリ起動時の設定適用
  initialize_app_settings();
});

// 設定画面のイベントリスナー設定関数
function setupSettingsEventListeners() {
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

  const linkColorPicker = document.getElementById("link_color");
  const linkColorText = document.getElementById("link_color_text");
  if (linkColorPicker && linkColorText) {
    linkColorPicker.addEventListener("change", () => sync_color_inputs(linkColorPicker, linkColorText));
    linkColorText.addEventListener("input", () => sync_text_inputs(linkColorText, linkColorPicker));
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

  // タブの閉じるボタンの位置設定
  const tabCloseButtonPosition = document.getElementById("tab_close_button_position");
  if (tabCloseButtonPosition) {
    tabCloseButtonPosition.addEventListener("change", save_settings);
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
}
