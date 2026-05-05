import { render } from '@testing-library/react';
import { detectLocale, LocaleProvider, useLocale } from '../locale';

describe('detectLocale', () => {
    it('returns the resolved Intl locale by default', () => {
        const tag = detectLocale();
        expect(tag).toMatch(/^[a-z]{2,3}(-[A-Z][a-zA-Z0-9-]*)?$/);
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
