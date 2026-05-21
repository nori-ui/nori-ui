import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { NoriProvider } from '../../../../provider';
import type { Column } from '../../DataTable';
import { DataTable } from '../../DataTable';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

type Row = { id: string; name: string; score: number };

const columns: Column<Row>[] = [
    { id: 'id', header: 'ID', cell: (r) => r.id },
    { id: 'name', header: 'Name', cell: (r) => r.name, sortable: true },
    { id: 'score', header: 'Score', cell: (r) => String(r.score) },
];

const data: Row[] = [
    { id: '1', name: 'Alice', score: 90 },
    { id: '2', name: 'Bob', score: 80 },
    { id: '3', name: 'Carol', score: 95 },
];

describe('<DataTable> native', () => {
    it('renders rows from data', () => {
        const { getByText } = render(wrap(<DataTable data={data} columns={columns} />));
        expect(getByText('Alice')).toBeTruthy();
        expect(getByText('Bob')).toBeTruthy();
        expect(getByText('Carol')).toBeTruthy();
    });

    it('renders column headers', () => {
        const { getByText, getByLabelText } = render(wrap(<DataTable data={data} columns={columns} />));
        expect(getByText('ID')).toBeTruthy();
        // Sortable header wraps in a Pressable — query by accessibilityLabel
        expect(getByLabelText('Sort by name')).toBeTruthy();
        expect(getByText('Score')).toBeTruthy();
    });

    it('shows empty state when data is empty', () => {
        const { getByText } = render(wrap(<DataTable data={[]} columns={columns} />));
        expect(getByText('No data')).toBeTruthy();
    });

    it('calls onRowPress when a row is pressed', () => {
        const handler = jest.fn();
        const { getAllByText } = render(wrap(<DataTable data={data} columns={columns} onRowPress={handler} />));
        // Press on the first row's name cell
        const aliceText = getAllByText('Alice').at(0);
        if (!aliceText) {
            throw new Error('aliceText not found');
        }
        // Row is a Pressable — fire press on its parent
        fireEvent.press(aliceText);
        // onRowPress should be called (via row press propagation)
        // If direct text press doesn't bubble, check via closest pressable
        expect(handler).toHaveBeenCalledTimes(1);
    });
});
