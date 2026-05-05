import { render } from '@testing-library/react';
import { detectLocale, LocaleProvider, useLocale } from '../locale';

describe('detectLocale', () => {
    it('returns a parseable BCP 47 locale tag', () => {
        const tag = detectLocale();
        expect(tag).toBeTruthy();
        // Round-trip parse — accepts plain tags AND Unicode-extension forms
        // like "en-US-u-hc-h12" or "th-TH-u-nu-thai" that Intl may emit on
        // some Node/ICU configurations.
        expect(() => new Intl.Locale(tag)).not.toThrow();
    });
});

describe('useLocale', () => {
    const Probe = ({ onValue }: { onValue: (v: string) => void }) => {
        const locale = useLocale();
        onValue(locale);
        return null;
    };

    it('returns detected locale when no provider is mounted', () => {
        let captured = '';
        render(
            <Probe
                onValue={(v) => {
                    captured = v;
                }}
            />
        );
        expect(captured).toBe(detectLocale());
    });

    it('returns the provider value when mounted', () => {
        let captured = '';
        render(
            <LocaleProvider locale="de-DE">
                <Probe
                    onValue={(v) => {
                        captured = v;
                    }}
                />
            </LocaleProvider>
        );
        expect(captured).toBe('de-DE');
    });

    it('accepts an Intl.Locale instance and returns its toString()', () => {
        let captured = '';
        render(
            <LocaleProvider locale={new Intl.Locale('fr-FR')}>
                <Probe
                    onValue={(v) => {
                        captured = v;
                    }}
                />
            </LocaleProvider>
        );
        expect(captured).toBe('fr-FR');
    });
});
