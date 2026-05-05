import { render } from '@testing-library/react';
import { useLocale } from '../../i18n/locale';
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
