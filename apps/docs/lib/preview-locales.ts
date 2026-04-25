import type { Dictionary } from '@nori-ui/core';

/**
 * Locales used by the `<Preview>` toggle. Keys mirror @nori-ui/core's
 * `defaultDictionary`; we only override the strings the v0 components
 * actually render (loading, common actions, checkbox/switch state). When
 * you add new i18n keys to the library, mirror them here so the preview
 * keeps demonstrating the locale switch end-to-end.
 *
 * `en` returns `undefined` — passing nothing makes NoriProvider fall back
 * to the library defaults, which is the source of truth for English.
 */
export const PREVIEW_LOCALES = {
    en: undefined,
    de: {
        'common.cancel': 'Abbrechen',
        'common.confirm': 'Bestätigen',
        'common.close': 'Schließen',
        'common.back': 'Zurück',
        'common.loading': 'Wird geladen',
        'common.error': 'Etwas ist schiefgelaufen',
        'common.retry': 'Erneut versuchen',
        'button.loadingLabel': 'Wird geladen',
        'input.clear': 'Löschen',
        'input.passwordShow': 'Passwort anzeigen',
        'input.passwordHide': 'Passwort verbergen',
        'checkbox.checked': 'Aktiviert',
        'checkbox.unchecked': 'Deaktiviert',
        'switch.on': 'An',
        'switch.off': 'Aus',
    } satisfies Dictionary,
    ja: {
        'common.cancel': 'キャンセル',
        'common.confirm': '確認',
        'common.close': '閉じる',
        'common.back': '戻る',
        'common.loading': '読み込み中',
        'common.error': 'エラーが発生しました',
        'common.retry': 'もう一度試す',
        'button.loadingLabel': '読み込み中',
        'input.clear': 'クリア',
        'input.passwordShow': 'パスワードを表示',
        'input.passwordHide': 'パスワードを非表示',
        'checkbox.checked': 'オン',
        'checkbox.unchecked': 'オフ',
        'switch.on': 'オン',
        'switch.off': 'オフ',
    } satisfies Dictionary,
} as const;

export type PreviewLocale = keyof typeof PREVIEW_LOCALES;
export const PREVIEW_LOCALE_OPTIONS: readonly PreviewLocale[] = ['en', 'de', 'ja'];

export type PreviewDirection = 'ltr' | 'rtl';
export const PREVIEW_DIRECTION_OPTIONS: readonly PreviewDirection[] = ['ltr', 'rtl'];
