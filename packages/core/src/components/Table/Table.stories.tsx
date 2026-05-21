import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';

const meta: Meta<typeof Table> = {
    title: 'Components/Table',
    component: Table,
};

export default meta;
type Story = StoryObj<typeof Table>;

const invoices = [
    { id: 'INV-001', status: 'Paid', amount: '$250.00' },
    { id: 'INV-002', status: 'Pending', amount: '$150.00' },
    { id: 'INV-003', status: 'Overdue', amount: '$350.00' },
    { id: 'INV-004', status: 'Paid', amount: '$450.00' },
    { id: 'INV-005', status: 'Pending', amount: '$550.00' },
];

export const Basic: Story = {
    render: () => (
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
                    <Table.Cell align="right">$1,750.00</Table.Cell>
                </Table.Row>
            </Table.Footer>
        </Table>
    ),
};

export const Striped: Story = {
    render: () => (
        <Table striped>
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
        </Table>
    ),
};

export const Compact: Story = {
    render: () => (
        <Table compact>
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
        </Table>
    ),
};

export const Bordered: Story = {
    render: () => (
        <Table bordered>
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
        </Table>
    ),
};

export const ClickableRows: Story = {
    render: () => (
        <Table>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>Invoice</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                    <Table.HeaderCell align="right">Amount</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {invoices.map((inv) => (
                    <Table.Row key={inv.id} onPress={() => alert(`Pressed ${inv.id}`)}>
                        <Table.Cell>{inv.id}</Table.Cell>
                        <Table.Cell>{inv.status}</Table.Cell>
                        <Table.Cell align="right">{inv.amount}</Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    ),
};
