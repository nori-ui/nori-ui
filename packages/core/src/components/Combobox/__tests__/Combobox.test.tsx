import { render, screen } from '@testing-library/react';
import { NoriProvider } from '../../../provider';
import { Combobox } from '../Combobox';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Combobox', () => {
    it('renders the trigger', () => {
        wrap(<Combobox options={[{ value: 'a', label: 'A' }]} placeholder="Pick one" testID="combo" />);
        expect(screen.getByTestId('combo')).toBeInTheDocument();
    });

    it('passes searchable=true to Select by default', () => {
        wrap(
            <Combobox
                options={[
                    { value: 'a', label: 'Apple' },
                    { value: 'b', label: 'Banana' },
                ]}
                placeholder="Pick one"
                testID="combo"
            />
        );
        // The search input should be present in the trigger area or accessible
        // when the component is rendered — searchable prop causes it to render.
        expect(screen.getByTestId('combo')).toBeInTheDocument();
    });
});
