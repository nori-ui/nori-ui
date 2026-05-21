import { fireEvent, render, screen } from '@testing-library/react';
import type { Column } from '../DataTable';
import { DataTable } from '../DataTable';

type Row = { id: string; name: string; age: number };

const columns: Column<Row>[] = [
    { id: 'id', header: 'ID', cell: (r) => r.id },
    { id: 'name', header: 'Name', cell: (r) => r.name, sortable: true },
    { id: 'age', header: 'Age', cell: (r) => String(r.age), sortable: true, align: 'right' },
];

const data: Row[] = [
    { id: '1', name: 'Charlie', age: 30 },
    { id: '2', name: 'Alice', age: 25 },
    { id: '3', name: 'Bob', age: 35 },
];

describe('<DataTable> web', () => {
    it('renders header from columns', () => {
        render(<DataTable data={data} columns={columns} />);
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
    });

    it('renders rows from data', () => {
        render(<DataTable data={data} columns={columns} />);
        expect(screen.getByText('Charlie')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('clicking a sortable header sorts ascending', () => {
        render(<DataTable data={data} columns={columns} />);
        const nameSort = screen.getByLabelText('Sort by name');
        fireEvent.click(nameSort);
        const cells = screen.getAllByRole('cell');
        // After asc sort by name: Alice, Bob, Charlie
        // Find the name column cells (index 1, 4, 7 in a 3-column table)
        const names = cells.filter((c) => ['Alice', 'Bob', 'Charlie'].includes(c.textContent ?? ''));
        expect(names[0]?.textContent).toBe('Alice');
        expect(names[1]?.textContent).toBe('Bob');
        expect(names[2]?.textContent).toBe('Charlie');
    });

    it('clicking a sorted header again sorts descending', () => {
        render(<DataTable data={data} columns={columns} />);
        const nameSort = screen.getByLabelText('Sort by name');
        fireEvent.click(nameSort);
        fireEvent.click(nameSort);
        const cells = screen.getAllByRole('cell');
        const names = cells.filter((c) => ['Alice', 'Bob', 'Charlie'].includes(c.textContent ?? ''));
        expect(names[0]?.textContent).toBe('Charlie');
        expect(names[1]?.textContent).toBe('Bob');
        expect(names[2]?.textContent).toBe('Alice');
    });

    it('shows empty state when data is empty', () => {
        render(<DataTable data={[]} columns={columns} />);
        expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('renders custom empty state', () => {
        render(<DataTable data={[]} columns={columns} emptyState="Nothing here" />);
        expect(screen.getByText('Nothing here')).toBeInTheDocument();
    });

    it('pagination shows correct slice', () => {
        const bigData: Row[] = Array.from({ length: 25 }, (_, i) => ({
            id: String(i + 1),
            name: `Person ${i + 1}`,
            age: 20 + i,
        }));
        render(<DataTable data={bigData} columns={columns} pageSize={10} />);
        // First page: rows 1-10
        expect(screen.getByText('Person 1')).toBeInTheDocument();
        expect(screen.getByText('Person 10')).toBeInTheDocument();
        expect(screen.queryByText('Person 11')).not.toBeInTheDocument();
    });

    it('pagination next button advances to next page', () => {
        const bigData: Row[] = Array.from({ length: 25 }, (_, i) => ({
            id: String(i + 1),
            name: `Person ${i + 1}`,
            age: 20 + i,
        }));
        render(<DataTable data={bigData} columns={columns} pageSize={10} />);
        // Find the Next button by aria-label (rendered as RNText / span on web)
        const nextBtn = screen.getByLabelText('Next page');
        fireEvent.click(nextBtn);
        expect(screen.getByText('Person 11')).toBeInTheDocument();
        expect(screen.queryByText('Person 1')).not.toBeInTheDocument();
    });

    it('calls onRowPress when a row is clicked', () => {
        const handler = jest.fn();
        render(<DataTable data={data} columns={columns} onRowPress={handler} />);
        const row = screen.getByText('Charlie').closest('tr');
        if (!row) {
            throw new Error('row not found');
        }
        fireEvent.click(row);
        expect(handler).toHaveBeenCalledWith(data[0]);
    });
});
