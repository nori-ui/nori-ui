'use client';

import { Table } from '@nori-ui/core';

const invoices = [
    { id: 'INV-001', status: 'Paid', amount: '$250.00' },
    { id: 'INV-002', status: 'Pending', amount: '$150.00' },
    { id: 'INV-003', status: 'Overdue', amount: '$350.00' },
];

export default function TableBasicDemo() {
    return (
        <Table>
            <Table.Caption>Recent invoices</Table.Caption>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>Invoice</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                    <Table.HeaderCell align="right">Amount</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {invoices.map((inv) => (
                    <Table.Row key={inv.id}>
                        <Table.Cell>{inv.id}</Table.Cell>
                        <Table.Cell>{inv.status}</Table.Cell>
                        <Table.Cell align="right">{inv.amount}</Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
            <Table.Footer>
                <Table.Row>
                    <Table.Cell colSpan={2}>Total</Table.Cell>
                    <Table.Cell align="right">$750.00</Table.Cell>
                </Table.Row>
            </Table.Footer>
        </Table>
    );
}
