import { resolveI18n } from '../resolve';
import type { Dictionary } from '../types';

describe('resolveI18n', () => {
    const defaults: Dictionary = {
        greet: 'Hello',
        'greet.named': 'Hello, {{name}}',
        items_one: '{{count}} item',
        items_other: '{{count}} items',
    };

    it('returns a function that reads from the default dictionary when input is undefined', () => {
        const t = resolveI18n(undefined, defaults);
        expect(t('greet')).toBe('Hello');
    });

    it('interpolates {{vars}} from options', () => {
        const t = resolveI18n(undefined, defaults);
        expect(t('greet.named', { name: 'Alice' })).toBe('Hello, Alice');
    });

    it('picks plural suffix based on count', () => {
        const t = resolveI18n(undefined, defaults);
        expect(t('items', { count: 0 })).toBe('0 items');
        expect(t('items', { count: 1 })).toBe('1 item');
        expect(t('items', { count: 5 })).toBe('5 items');
    });

    it('falls back to the key when a dictionary entry is missing and no defaultValue is given', () => {
        const t = resolveI18n({}, defaults);
        expect(t('unknown.key')).toBe('unknown.key');
    });

    it('uses options.defaultValue when key is missing', () => {
        const t = resolveI18n({}, defaults);
        expect(t('unknown.key', { defaultValue: 'fallback' })).toBe('fallback');
    });

    it('overrides defaults via a flat dictionary input', () => {
        const t = resolveI18n({ greet: 'Hi' } as Dictionary, defaults);
        expect(t('greet')).toBe('Hi');
        // unmapped keys still fall back to defaults:
        expect(t('greet.named', { name: 'Bob' })).toBe('Hello, Bob');
    });

    it('calls through to a consumer-provided TranslateFn verbatim (i18next drop-in)', () => {
        const consumerT = jest.fn(
            (key: string | string[], _opts?: Record<string, unknown>) => `CONSUMER(${String(key)})`
        );
        const t = resolveI18n(consumerT, defaults);
        expect(t('greet')).toBe('CONSUMER(greet)');
        expect(consumerT).toHaveBeenCalledWith('greet', undefined);
    });

    it('accepts an array of keys — returns the first resolved one', () => {
        const t = resolveI18n({}, defaults);
        expect(t(['missing.a', 'missing.b', 'greet'])).toBe('Hello');
    });
});
