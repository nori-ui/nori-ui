import { render } from '@testing-library/react';
import { useLocale } from '../../i18n/locale';
import { useTranslation } from '../../i18n/use-translation';
import { tealTheme } from '../../theme/themes';
import { useTheme } from '../../theme/use-theme';
import { NoriProvider } from '../nori-provider';

describe('NoriProvider locale prop', () => {
    const Probe = ({ onValue }: { onValue: (v: string) => void }) => {
        onValue(useLocale());
        return null;
    };

    it('propagates explicit locale to descendants', () => {
        let captured = '';
        render(
            <NoriProvider locale="ja-JP">
                <Probe
                    onValue={(v) => {
                        captured = v;
                    }}
                />
            </NoriProvider>
        );
        expect(captured).toBe('ja-JP');
    });
});

describe('nested NoriProvider', () => {
    const Probe = ({ onValue }: { onValue: (v: { locale: string; close: string; primary: string }) => void }) => {
        const locale = useLocale();
        const { t } = useTranslation();
        const theme = useTheme();
        onValue({ locale, close: t('common.close'), primary: theme.color.primary['500'] });
        return null;
    };

    it('inherits locale, translations, and theme it does not override', () => {
        let outer = { locale: '', close: '', primary: '' };
        let inner = { locale: '', close: '', primary: '' };
        render(
            <NoriProvider locale="de-DE" i18n={{ 'common.close': 'Schließen' }} theme={tealTheme}>
                <Probe
                    onValue={(v) => {
                        outer = v;
                    }}
                />
                <NoriProvider colorScheme="light">
                    <Probe
                        onValue={(v) => {
                            inner = v;
                        }}
                    />
                </NoriProvider>
            </NoriProvider>
        );
        expect(outer).toEqual({ locale: 'de-DE', close: 'Schließen', primary: tealTheme.light.color.primary['500'] });
        expect(inner).toEqual(outer);
    });
});
