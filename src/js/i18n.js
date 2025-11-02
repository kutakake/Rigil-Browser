// 多言語対応モジュール (i18n)
// 日本語と英語の切り替えをサポート

class I18n {
    constructor() {
        this.currentLanguage = 'ja'; // デフォルトは日本語
        this.translations = {
            ja: {
                // 基本的なUI要素
                "url_placeholder": "URLを入力...",
                "new_tab": "+ 新しいタブ",
                "close": "×",
                
                // 設定画面
                "settings": "設定",
                "display_settings": "表示設定",
                "theme_preset": "テーマプリセット",
                "custom": "カスタム",
                "light": "ライト",
                "dark": "ダーク",
                "auto": "自動",
                "base_color": "ベースカラー（背景色）",
                "accent_color": "アクセントカラー（ボタン等）",
                "text_color": "文字色",
                "link_color": "リンク色",
                "reset_to_default": "デフォルトに戻す",
                "font_size": "フォントサイズ",
                
                // ブラウザ設定
                "browser_settings": "ブラウザ設定",
                "tab_close_button_position": "タブの閉じるボタンの位置",
                "left": "左",
                "right": "右",
                "auto_save_tabs": "タブの自動保存",
                "show_images": "画像を表示",
                
                // プロキシ設定
                "proxy_settings": "プロキシ設定",
                "use_proxy": "Rigil Proxyを使用する",
                "proxy_url": "プロキシURL",
                "proxy_status": "プロキシ状態",
                "proxy_disconnected": "未接続",
                "test_connection": "接続テスト",
                "proxy_description": "Rigil Proxyを使用すると、外部サーバー経由でHTML軽量化を行います。プロキシサーバーが起動していることを確認してください。",
                
                // プライバシー
                "privacy": "プライバシー",
                "clear_history": "履歴をクリア",
                "clear_cache": "キャッシュをクリア",
                
                // 言語・情報
                "language": "言語",
                "information": "情報",
                "version": "バージョン"
            },
            en: {
                // 基本的なUI要素
                "url_placeholder": "Enter URL...",
                "new_tab": "+ New Tab",
                "close": "×",
                
                // 設定画面
                "settings": "Settings",
                "display_settings": "Display Settings",
                "theme_preset": "Theme Preset",
                "custom": "Custom",
                "light": "Light",
                "dark": "Dark",
                "auto": "Auto",
                "base_color": "Base Color (Background)",
                "accent_color": "Accent Color (Buttons)",
                "text_color": "Text Color",
                "link_color": "Link Color",
                "reset_to_default": "Reset to Default",
                "font_size": "Font Size",
                
                // ブラウザ設定
                "browser_settings": "Browser Settings",
                "tab_close_button_position": "Tab Close Button Position",
                "left": "Left",
                "right": "Right",
                "auto_save_tabs": "Auto Save Tabs",
                "show_images": "Show Images",
                
                // プロキシ設定
                "proxy_settings": "Proxy Settings",
                "use_proxy": "Use Rigil Proxy",
                "proxy_url": "Proxy URL",
                "proxy_status": "Proxy Status",
                "proxy_disconnected": "Disconnected",
                "test_connection": "Test Connection",
                "proxy_description": "Using Rigil Proxy allows HTML optimization via external server. Make sure the proxy server is running.",
                
                // プライバシー
                "privacy": "Privacy",
                "clear_history": "Clear History",
                "clear_cache": "Clear Cache",
                
                // 言語・情報
                "language": "Language",
                "information": "Information",
                "version": "Version"
            }
        };
        
        // 保存された言語設定を読み込み
        this.loadLanguagePreference();
    }
    
    // 翻訳テキストを取得
    t(key) {
        const translation = this.translations[this.currentLanguage]?.[key];
        return translation || key; // 翻訳が見つからない場合はキーをそのまま返す
    }
    
    // 言語を変更
    setLanguage(language) {
        if (this.translations[language]) {
            this.currentLanguage = language;
            this.saveLanguagePreference();
            this.updateUI();
        }
    }
    
    // 現在の言語を取得
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    // 利用可能な言語一覧を取得
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
    
    // UIを更新
    updateUI() {
        // data-i18n属性を持つ要素を更新
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });
        
        // placeholder属性を持つ要素を更新
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
        
        // HTML lang属性を更新
        document.documentElement.lang = this.currentLanguage;
    }
    
    // 言語設定を保存
    saveLanguagePreference() {
        try {
            localStorage.setItem('rigil_language', this.currentLanguage);
        } catch (error) {
            console.error('言語設定の保存に失敗しました:', error);
        }
    }
    
    // 言語設定を読み込み
    loadLanguagePreference() {
        try {
            const savedLanguage = localStorage.getItem('rigil_language');
            if (savedLanguage && this.translations[savedLanguage]) {
                this.currentLanguage = savedLanguage;
            }
        } catch (error) {
            console.error('言語設定の読み込みに失敗しました:', error);
        }
    }
}

// グローバルインスタンスを作成
window.i18n = new I18n();

// DOMが読み込まれた後にUIを更新
document.addEventListener('DOMContentLoaded', () => {
    window.i18n.updateUI();
}); 