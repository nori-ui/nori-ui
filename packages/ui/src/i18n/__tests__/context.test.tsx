import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../context';
import { useTranslation } from '../use-translation';

function Greeter({ nameKey }: { nameKey?: string }) {
    const { t } = useTranslation();
    return <span data-testid="g">{t(nameKey ?? 'greet')}</span>;
}

describe('<I18nProvider> + useTranslation()', () => {
    it('returns defaults when no provider wraps the tree', () => {
        render(<Greeter nameKey="common.cancel" />);
        expect(screen.getByTestId('g')).toHaveTextContent('Cancel');
    });

    it('uses provider dictionary when given', () => {
        render(
            <I18nProvider i18n={{ 'common.cancel': 'Abbrechen' }}>
                <Greeter nameKey="common.cancel" />
            </I18nProvider>
        );
        expect(screen.getByTestId('g')).toHaveTextContent('Abbrechen');
    });

    it('uses provider function (i18next drop-in) when given', () => {
        const t = jest.fn((key: string | string[]) => `T(${String(key)})`);
        render(
            <I18nProvider i18n={t}>
                <Greeter nameKey="common.cancel" />
            </I18nProvider>
        );
        expect(screen.getByTestId('g')).toHaveTextContent('T(common.cancel)');
    });
});
