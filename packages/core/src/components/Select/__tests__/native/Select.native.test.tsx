/**
 * Native tests for Select. The popup renders inside an RN `<Modal>`, so
 * queries opt out of hidden-element filtering (same pattern as the Command
 * and Sheet native tests).
 */
import { act, fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { NoriProvider } from '../../../../provider';
import { Combobox } from '../../../Combobox';
import { Select, type SelectOption } from '../../Select';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

const H = { includeHiddenElements: true } as const;

const FRUITS: SelectOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
];

describe('<Select> native', () => {
    it('opens a searchable Select and filters through the search field', () => {
        jest.useFakeTimers();
        try {
            const { getByLabelText, getByText, queryByText } = render(
                wrap(<Select options={FRUITS} searchable aria-label="Fruit" />)
            );
            fireEvent.press(getByLabelText('Fruit'));
            expect(getByText('Banana', H)).toBeTruthy();

            fireEvent.changeText(getByLabelText('Search options', H), 'ban');
            // The filter is debounced.
            act(() => {
                jest.advanceTimersByTime(200);
            });
            expect(getByText('Banana', H)).toBeTruthy();
            expect(queryByText('Apple', H)).toBeNull();
        } finally {
            jest.useRealTimers();
        }
    });

    it('opens a Combobox and selects an option', () => {
        const onChange = jest.fn();
        const { getByLabelText, getByText } = render(
            wrap(<Combobox options={FRUITS} onChange={onChange} aria-label="Fruit" />)
        );
        fireEvent.press(getByLabelText('Fruit'));
        fireEvent.press(getByText('Cherry', H));
        expect(onChange).toHaveBeenCalledWith('cherry', expect.objectContaining({ value: 'cherry' }));
    });
});
