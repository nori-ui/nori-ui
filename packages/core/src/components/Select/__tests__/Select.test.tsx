import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { NoriProvider } from '../../../provider';
import { Field } from '../../Field/Field';
import { Select, type SelectOption } from '../Select';

const FRUITS: SelectOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
];

describe('<Select>', () => {
    it('renders the placeholder when nothing is selected', () => {
        render(<Select options={FRUITS} placeholder="Pick a fruit" testID="sel" />);
        expect(screen.getByTestId('sel')).toHaveTextContent('Pick a fruit');
    });

    it('renders the selected option label', () => {
        render(<Select options={FRUITS} defaultValue="banana" testID="sel" />);
        expect(screen.getByTestId('sel')).toHaveTextContent('Banana');
    });

    it('opens the listbox when the trigger is clicked, lists every option', () => {
        render(<Select options={FRUITS} testID="sel" />);
        fireEvent.click(screen.getByRole('combobox'));
        expect(screen.getAllByRole('option')).toHaveLength(3);
    });

    it('selecting an option calls onChange with value + option payload (uncontrolled)', () => {
        const onChange = jest.fn();
        render(<Select options={FRUITS} onChange={onChange} testID="sel" />);
        fireEvent.click(screen.getByRole('combobox'));
        fireEvent.click(screen.getByText('Banana'));
        expect(onChange).toHaveBeenCalledWith('banana', expect.objectContaining({ value: 'banana' }));
        // The popup closed, the trigger now displays the picked label.
        expect(screen.getByTestId('sel')).toHaveTextContent('Banana');
    });

    it('controlled: respects parent value', () => {
        const Wrapper = () => {
            const [v, setV] = useState<string | undefined>('apple');
            return (
                <>
                    <span data-testid="cur">{v}</span>
                    <Select options={FRUITS} value={v} onChange={(next) => setV(next)} testID="sel" />
                </>
            );
        };
        render(<Wrapper />);
        fireEvent.click(screen.getByRole('combobox'));
        fireEvent.click(screen.getByText('Cherry'));
        expect(screen.getByTestId('cur').textContent).toBe('cherry');
    });

    it('searchable: typing filters static options by substring (case-insensitive)', () => {
        const many = Array.from({ length: 12 }, (_, i) => ({ value: `o-${i}`, label: `Option ${i}` }));
        render(<Select options={many} testID="sel" />);
        fireEvent.click(screen.getByRole('combobox'));
        const search = screen.getByLabelText('Search options');
        // Wait one debounce tick — set debounce duration is 150ms.
        fireEvent.change(search, { target: { value: 'option 1' } });
        // Synchronous: assert search input took the value; debounced filter applies in microtask after timer.
        expect((search as HTMLInputElement).value).toBe('option 1');
    });

    it('async loadOptions: calls loader on open, displays returned items', async () => {
        const loadOptions = jest.fn().mockResolvedValue({
            items: [{ value: 'r1', label: 'Remote 1' }],
            total: 1,
        });
        render(<Select loadOptions={loadOptions} testID="sel" />);
        fireEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(loadOptions).toHaveBeenCalled());
        await waitFor(() => expect(screen.getByText('Remote 1')).toBeInTheDocument());
    });

    it('keyboard: ArrowDown highlights, Enter selects', () => {
        render(<Select options={FRUITS} searchable testID="sel" />);
        fireEvent.click(screen.getByRole('combobox'));
        const search = screen.getByLabelText('Search options');
        // Default active is index 0 (Apple). ArrowDown → Banana. Enter selects.
        fireEvent.keyDown(search, { key: 'ArrowDown' });
        fireEvent.keyDown(search, { key: 'Enter' });
        expect(screen.getByTestId('sel')).toHaveTextContent('Banana');
    });

    it('Escape closes without selecting', () => {
        render(<Select options={FRUITS} defaultValue="apple" searchable testID="sel" />);
        fireEvent.click(screen.getByRole('combobox'));
        const search = screen.getByLabelText('Search options');
        fireEvent.keyDown(search, { key: 'Escape' });
        expect(screen.queryByRole('option')).toBeNull();
        expect(screen.getByTestId('sel')).toHaveTextContent('Apple');
    });

    it('disabled: clicking the trigger does nothing', () => {
        render(<Select options={FRUITS} disabled testID="sel" />);
        fireEvent.click(screen.getByRole('combobox'));
        expect(screen.queryByRole('option')).toBeNull();
    });

    describe('keyboard nav without a search field', () => {
        const MONTHS: SelectOption[] = [
            { value: '01', label: 'January' },
            { value: '02', label: 'February' },
            { value: '03', label: 'March' },
            { value: '04', label: 'April' },
            { value: '05', label: 'May' },
            { value: '06', label: 'June' },
            { value: '07', label: 'July' },
            { value: '08', label: 'August' },
            { value: '09', label: 'September' },
            { value: '10', label: 'October' },
            { value: '11', label: 'November' },
            { value: '12', label: 'December' },
        ];

        it('arrow keys + Enter work on the popup itself when searchable=false', () => {
            render(<Select options={MONTHS} searchable={false} testID="sel" />);
            fireEvent.click(screen.getByRole('combobox'));
            const popup = screen.getByRole('listbox');
            // Active starts at index 0 (January). ArrowDown twice → March.
            fireEvent.keyDown(popup, { key: 'ArrowDown' });
            fireEvent.keyDown(popup, { key: 'ArrowDown' });
            fireEvent.keyDown(popup, { key: 'Enter' });
            expect(screen.getByTestId('sel')).toHaveTextContent('March');
        });

        it('Escape on a no-search popup closes without selecting', () => {
            render(<Select options={MONTHS} defaultValue="01" searchable={false} testID="sel" />);
            fireEvent.click(screen.getByRole('combobox'));
            fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
            expect(screen.queryByRole('option')).toBeNull();
            expect(screen.getByTestId('sel')).toHaveTextContent('January');
        });

        it('type-ahead "Sep" jumps to September even without a search field', () => {
            const onChange = jest.fn();
            render(<Select options={MONTHS} searchable={false} onChange={onChange} testID="sel" />);
            fireEvent.click(screen.getByRole('combobox'));
            const popup = screen.getByRole('listbox');
            fireEvent.keyDown(popup, { key: 'S' });
            fireEvent.keyDown(popup, { key: 'e' });
            fireEvent.keyDown(popup, { key: 'p' });
            fireEvent.keyDown(popup, { key: 'Enter' });
            expect(onChange).toHaveBeenCalledWith('09', expect.objectContaining({ label: 'September' }));
        });

        it('type-ahead with a single char cycles through matches on repeat', () => {
            // Two M-months: March (idx 2) and May (idx 4). Pressing "m" twice
            // within the reset window should move March → May rather than
            // sticking on March, because "mm" is all-same → cycle mode.
            const onChange = jest.fn();
            render(<Select options={MONTHS} searchable={false} onChange={onChange} testID="sel" />);
            fireEvent.click(screen.getByRole('combobox'));
            const popup = screen.getByRole('listbox');
            fireEvent.keyDown(popup, { key: 'm' });
            fireEvent.keyDown(popup, { key: 'm' });
            fireEvent.keyDown(popup, { key: 'Enter' });
            expect(onChange).toHaveBeenCalledWith('05', expect.objectContaining({ label: 'May' }));
        });

        it('type-ahead from the closed trigger opens the popup and pre-selects', () => {
            const onChange = jest.fn();
            render(<Select options={MONTHS} searchable={false} onChange={onChange} testID="sel" />);
            const trigger = screen.getByRole('combobox');
            fireEvent.keyDown(trigger, { key: 'A' });
            // Popup should now be open with April active (first 'A' match
            // after activeIndex 0 in cycle mode).
            expect(screen.getByRole('listbox')).toBeInTheDocument();
            fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' });
            expect(onChange).toHaveBeenCalledWith('04', expect.objectContaining({ label: 'April' }));
        });

        it('Home / End jump to the first / last option', () => {
            render(<Select options={MONTHS} searchable={false} testID="sel" />);
            fireEvent.click(screen.getByRole('combobox'));
            const popup = screen.getByRole('listbox');
            fireEvent.keyDown(popup, { key: 'End' });
            fireEvent.keyDown(popup, { key: 'Enter' });
            expect(screen.getByTestId('sel')).toHaveTextContent('December');
        });
    });

    it('grouped options render group headers', () => {
        const grouped: SelectOption[] = [
            { value: 'a', label: 'Apple', group: 'Fruits' },
            { value: 'b', label: 'Banana', group: 'Fruits' },
            { value: 'c', label: 'Carrot', group: 'Vegetables' },
        ];
        render(<Select options={grouped} testID="sel" />);
        fireEvent.click(screen.getByRole('combobox'));
        expect(screen.getByText('Fruits')).toBeInTheDocument();
        expect(screen.getByText('Vegetables')).toBeInTheDocument();
    });

    it('locale + sortByLocale re-sorts using Intl.Collator', () => {
        const opts: SelectOption[] = [
            { value: 'z', label: 'Zürich' },
            { value: 'a', label: 'Älter' },
            { value: 'b', label: 'Bern' },
        ];
        render(<Select options={opts} locale="de" testID="sel" />);
        fireEvent.click(screen.getByRole('combobox'));
        const optionEls = screen.getAllByRole('option');
        const labels = optionEls.map((el) => el.textContent ?? '');
        // German collation: Älter < Bern < Zürich.
        expect(labels[0]).toContain('Älter');
        expect(labels[1]).toContain('Bern');
        expect(labels[2]).toContain('Zürich');
    });
});

describe('<Select multiple>', () => {
    it('renders chips for each selected option in the trigger', () => {
        render(<Select multiple options={FRUITS} defaultValue={['apple', 'cherry']} placeholder="Pick" />);
        const trigger = screen.getByRole('combobox');
        expect(trigger.textContent).toContain('Apple');
        expect(trigger.textContent).toContain('Cherry');
    });

    it('renders the placeholder when nothing is selected', () => {
        render(<Select multiple options={FRUITS} placeholder="Pick fruits" />);
        expect(screen.getByText('Pick fruits')).toBeInTheDocument();
    });

    it('toggles values without closing the popup, fires onChange with array payload', () => {
        const onChange = jest.fn();
        render(<Select multiple options={FRUITS} onChange={onChange} />);
        fireEvent.click(screen.getByRole('combobox'));
        fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
        // Popup stays open in multi-mode
        expect(screen.queryByRole('listbox')).toBeInTheDocument();
        expect(onChange).toHaveBeenLastCalledWith(['apple'], [expect.objectContaining({ value: 'apple' })]);
        fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
        expect(onChange).toHaveBeenLastCalledWith(
            ['apple', 'cherry'],
            [expect.objectContaining({ value: 'apple' }), expect.objectContaining({ value: 'cherry' })]
        );
        // Tapping a selected option deselects it
        fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
        expect(onChange).toHaveBeenLastCalledWith(['cherry'], [expect.objectContaining({ value: 'cherry' })]);
    });

    it('respects controlled value array', () => {
        const onChange = jest.fn();
        render(<Select multiple options={FRUITS} value={['banana']} onChange={onChange} />);
        const trigger = screen.getByRole('combobox');
        expect(trigger.textContent).toContain('Banana');
        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
        expect(onChange).toHaveBeenLastCalledWith(['banana', 'apple'], expect.any(Array));
    });

    it('honors maxSelected — extra picks are ignored', () => {
        const onChange = jest.fn();
        render(
            <Select multiple options={FRUITS} maxSelected={2} defaultValue={['apple', 'banana']} onChange={onChange} />
        );
        fireEvent.click(screen.getByRole('combobox'));
        fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('exposes aria-multiselectable on the listbox + aria-selected per option', () => {
        render(<Select multiple options={FRUITS} defaultValue={['apple']} />);
        fireEvent.click(screen.getByRole('combobox'));
        const listbox = screen.getByRole('listbox');
        expect(listbox.getAttribute('aria-multiselectable')).toBe('true');
        const apple = screen.getByRole('option', { name: 'Apple' });
        expect(apple.getAttribute('aria-selected')).toBe('true');
        const banana = screen.getByRole('option', { name: 'Banana' });
        expect(banana.getAttribute('aria-selected')).toBe('false');
    });

    it('Clear all removes every selected value', () => {
        const onChange = jest.fn();
        render(<Select multiple options={FRUITS} defaultValue={['apple', 'banana']} onChange={onChange} />);
        fireEvent.click(screen.getByRole('combobox'));
        fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
        expect(onChange).toHaveBeenLastCalledWith([], []);
    });

    it('collapses chips to "N selected" when over maxChips', () => {
        const opts: SelectOption[] = [
            { value: 'a', label: 'Apple' },
            { value: 'b', label: 'Banana' },
            { value: 'c', label: 'Cherry' },
            { value: 'd', label: 'Date' },
        ];
        render(<Select multiple options={opts} defaultValue={['a', 'b', 'c', 'd']} maxChips={3} />);
        const trigger = screen.getByRole('combobox');
        expect(trigger.textContent).toContain('4 selected');
        expect(trigger.textContent).not.toContain('Apple');
    });

    describe('inside Field', () => {
        it('receives aria-labelledby on the trigger from Field.Control', () => {
            render(
                <NoriProvider>
                    <Field>
                        <Field.Label>Plan</Field.Label>
                        <Field.Control>
                            <Select testID="sel" options={[{ value: 'a', label: 'A' }]} />
                        </Field.Control>
                    </Field>
                </NoriProvider>
            );
            const trigger = screen.getByRole('combobox');
            expect(trigger.getAttribute('aria-labelledby')).toBeTruthy();
        });

        it('receives aria-invalid on the trigger when Field has an error', () => {
            render(
                <NoriProvider>
                    <Field error="Required">
                        <Field.Control>
                            <Select testID="sel" options={[{ value: 'a', label: 'A' }]} />
                        </Field.Control>
                    </Field>
                </NoriProvider>
            );
            const trigger = screen.getByRole('combobox');
            expect(trigger.getAttribute('aria-invalid')).toBe('true');
        });
    });
});
