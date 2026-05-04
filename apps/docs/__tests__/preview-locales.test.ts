import { PREVIEW_LOCALES } from '../lib/preview-locales';

describe('PREVIEW_LOCALES', () => {
    test('includes en, de, ja, ar, he', () => {
        expect(Object.keys(PREVIEW_LOCALES).sort()).toEqual(['ar', 'de', 'en', 'he', 'ja']);
    });

    test('en is undefined (NoriProvider falls back to library defaults)', () => {
        // Explicit undefined keeps our docs honest: the library's English is
        // the source of truth, not a parallel dictionary that could drift.
        expect(PREVIEW_LOCALES.en).toBeUndefined();
    });

    test('de and ja have identical keys', () => {
        // Catches the obvious authoring slip: adding a string to one
        // dictionary and forgetting to add the matching translation to the
        // other.
        const de = PREVIEW_LOCALES.de;
        const ja = PREVIEW_LOCALES.ja;
        expect(de).toBeDefined();
        expect(ja).toBeDefined();
        expect(Object.keys(de as Record<string, string>).sort()).toEqual(
            Object.keys(ja as Record<string, string>).sort()
        );
    });

    test('all translations are non-empty strings', () => {
        const empties: string[] = [];
        for (const [name, dict] of Object.entries(PREVIEW_LOCALES)) {
            if (dict === undefined) {
                continue;
            }
            for (const [key, value] of Object.entries(dict)) {
                if (typeof value !== 'string' || value.length === 0) {
                    empties.push(`${name}.${key}`);
                }
            }
        }
        expect(empties).toEqual([]);
    });
});
