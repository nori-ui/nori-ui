'use client';

import type { Column } from '@nori-ui/core';
import { DataTable } from '@nori-ui/core';

type Invoice = {
    id: string;
    customer: string;
    status: string;
    amount: number;
};

const columns: Column<Invoice>[] = [
    { id: 'id', header: 'Invoice', cell: (r) => r.id },
    { id: 'customer', header: 'Customer', cell: (r) => r.customer, sortable: true },
    { id: 'status', header: 'Status', cell: (r) => r.status, sortable: true },
    {
        id: 'amount',
        header: 'Amount',
        cell: (r) => `$${r.amount.toFixed(2)}`,
        sortable: true,
        align: 'right',
    },
];

const data: Invoice[] = [
    { id: 'INV-001', customer: 'Alice', status: 'Paid', amount: 250 },
    { id: 'INV-002', customer: 'Bob', status: 'Pending', amount: 150 },
    { id: 'INV-003', customer: 'Carol', status: 'Overdue', amount: 350 },
    { id: 'INV-004', customer: 'Dave', status: 'Paid', amount: 450 },
    { id: 'INV-005', customer: 'Eve', status: 'Pending', amount: 550 },
];

export default function DataTableBasicDemo() {
    return <DataTable data={data} columns={columns} />;
}
