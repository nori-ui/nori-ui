import type { Meta, StoryObj } from '@storybook/react';
import type { Column } from './DataTable';
import { DataTable } from './DataTable';

const meta: Meta<typeof DataTable> = {
    title: 'Components/DataTable',
    component: DataTable,
};

export default meta;
type Story = StoryObj<typeof DataTable>;

type Invoice = {
    id: string;
    customer: string;
    status: 'Paid' | 'Pending' | 'Overdue';
    amount: number;
    date: string;
};

const invoices: Invoice[] = [
    { id: 'INV-001', customer: 'Alice', status: 'Paid', amount: 250, date: '2024-01-01' },
    { id: 'INV-002', customer: 'Bob', status: 'Pending', amount: 150, date: '2024-01-05' },
    { id: 'INV-003', customer: 'Carol', status: 'Overdue', amount: 350, date: '2024-01-10' },
    { id: 'INV-004', customer: 'Dave', status: 'Paid', amount: 450, date: '2024-01-15' },
    { id: 'INV-005', customer: 'Eve', status: 'Pending', amount: 550, date: '2024-01-20' },
];

const columns: Column<Invoice>[] = [
    { id: 'id', header: 'Invoice', cell: (row) => row.id },
    { id: 'customer', header: 'Customer', cell: (row) => row.customer, sortable: true },
    { id: 'status', header: 'Status', cell: (row) => row.status, sortable: true },
    { id: 'amount', header: 'Amount', cell: (row) => `$${row.amount.toFixed(2)}`, sortable: true, align: 'right' },
];

export const Basic: Story = {
    render: () => <DataTable data={invoices} columns={columns} />,
};

export const WithSort: Story = {
    render: () => <DataTable data={invoices} columns={columns} defaultSort={{ id: 'amount', direction: 'asc' }} />,
};

export const WithPagination: Story = {
    render: () => {
        const manyRows: Invoice[] = Array.from({ length: 50 }, (_, i) => ({
            id: `INV-${String(i + 1).padStart(3, '0')}`,
            customer: `Customer ${i + 1}`,
            status: (['Paid', 'Pending', 'Overdue'] as const)[i % 3] ?? 'Paid',
            amount: (i + 1) * 25,
            date: '2024-01-01',
        }));
        return <DataTable data={manyRows} columns={columns} pageSize={10} />;
    },
};

export const EmptyState: Story = {
    render: () => <DataTable data={[]} columns={columns} />,
};

export const CustomEmptyState: Story = {
    render: () => <DataTable data={[]} columns={columns} emptyState="No invoices found." />,
};
