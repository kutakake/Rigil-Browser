// Rigil - メインエントリーポイント
// 分割されたJavaScriptファイルを読み込み、アプリケーションを初期化

// 各機能モジュールは以下のファイルに分割されています:
// - js/core.js: コア機能（初期化、ページ取得、ナビゲーション）
// - js/tabs.js: タブ管理機能
// - js/settings.js: 設定画面とテーマ機能
// - js/events.js: イベントリスナーとグローバル関数の設定

// このファイルは各モジュールが読み込まれた後に実行される
// 必要に応じて追加の初期化処理をここに記述

// グローバル関数を定義
window.globalFunction = {
  greet,
  show_hide_tabs,
  add_tab,
  close_tab,
  switch_tab,
  open_settings,
  close_settings,
  save_settings,
  reset_theme,
  clear_history,
  clear_cache,
  change_language,
  reflesh_page,
  test_proxy_connection,
  get_page_via_proxy
};