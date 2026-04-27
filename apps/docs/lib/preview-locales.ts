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
 *
 * `ar` and `he` are paired with the RTL direction toggle so the picker
 * can demonstrate full RTL layout + localized chrome strings together.
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
    ar: {
        'common.cancel': 'إلغاء',
        'common.confirm': 'تأكيد',
        'common.close': 'إغلاق',
        'common.back': 'رجوع',
        'common.loading': 'جارٍ التحميل',
        'common.error': 'حدث خطأ ما',
        'common.retry': 'حاول مرة أخرى',
        'button.loadingLabel': 'جارٍ التحميل',
        'input.clear': 'مسح',
        'input.passwordShow': 'إظهار كلمة المرور',
        'input.passwordHide': 'إخفاء كلمة المرور',
        'checkbox.checked': 'محدد',
        'checkbox.unchecked': 'غير محدد',
        'switch.on': 'تشغيل',
        'switch.off': 'إيقاف',
    } satisfies Dictionary,
    he: {
        'common.cancel': 'ביטול',
        'common.confirm': 'אישור',
        'common.close': 'סגירה',
        'common.back': 'חזור',
        'common.loading': 'טוען',
        'common.error': 'משהו השתבש',
        'common.retry': 'נסה שוב',
        'button.loadingLabel': 'טוען',
        'input.clear': 'נקה',
        'input.passwordShow': 'הצג סיסמה',
        'input.passwordHide': 'הסתר סיסמה',
        'checkbox.checked': 'מסומן',
        'checkbox.unchecked': 'לא מסומן',
        'switch.on': 'מופעל',
        'switch.off': 'כבוי',
    } satisfies Dictionary,
} as const;

export type PreviewLocale = keyof typeof PREVIEW_LOCALES;
export const PREVIEW_LOCALE_OPTIONS: readonly PreviewLocale[] = ['en', 'de', 'ja', 'ar', 'he'];

export type PreviewDirection = 'ltr' | 'rtl';
export const PREVIEW_DIRECTION_OPTIONS: readonly PreviewDirection[] = ['ltr', 'rtl'];

/**
 * Locales whose script is RTL. The Preview component flips the direction
 * toggle automatically when one of these is selected, so a reader picking
 * "ar" sees the layout flip + Arabic strings together rather than having
 * to toggle two controls.
 */
export const RTL_LOCALES: ReadonlySet<PreviewLocale> = new Set<PreviewLocale>(['ar', 'he']);
