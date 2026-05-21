import { fireEvent, render, screen } from '@testing-library/react';
import { Table } from '../Table';

describe('<Table> web', () => {
    it('renders semantic thead and tbody elements', () => {
        const { container } = render(
            <Table>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Name</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell>Alice</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
        expect(container.querySelector('thead')).toBeInTheDocument();
        expect(container.querySelector('tbody')).toBeInTheDocument();
        expect(container.querySelector('table')).toBeInTheDocument();
    });

    it('renders cell content', () => {
        render(
            <Table>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell>INV-001</Table.Cell>
                        <Table.Cell>Paid</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
        expect(screen.getByText('INV-001')).toBeInTheDocument();
        expect(screen.getByText('Paid')).toBeInTheDocument();
    });

    it('applies text-right class when align="right" on a Cell', () => {
        const { container } = render(
            <Table>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell align="right">$250.00</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
        const td = container.querySelector('td');
        expect(td?.className).toContain('text-right');
    });

    it('applies text-right class when align="right" on a HeaderCell', () => {
        const { container } = render(
            <Table>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell align="right">Amount</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell>-</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
        const th = container.querySelector('th');
        expect(th?.className).toContain('text-right');
    });

    it('renders a caption element', () => {
        const { container } = render(
            <Table>
                <Table.Caption>My caption</Table.Caption>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell>data</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
        expect(container.querySelector('caption')).toBeInTheDocument();
        expect(screen.getByText('My caption')).toBeInTheDocument();
    });

    it('renders a tfoot element', () => {
        const { container } = render(
            <Table>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell>data</Table.Cell>
                    </Table.Row>
                </Table.Body>
                <Table.Footer>
                    <Table.Row>
                        <Table.Cell>Total</Table.Cell>
                    </Table.Row>
                </Table.Footer>
            </Table>
        );
        expect(container.querySelector('tfoot')).toBeInTheDocument();
    });

    it('calls onPress when a row is clicked', () => {
        const handler = jest.fn();
        render(
            <Table>
                <Table.Body>
                    <Table.Row onPress={handler} testID="row">
                        <Table.Cell>click me</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
        const row = screen.getByText('click me').closest('tr');
        if (!row) {
            throw new Error('row not found');
        }
        fireEvent.click(row);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('colSpan is forwarded to td', () => {
        const { container } = render(
            <Table>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell colSpan={3}>wide</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
        expect(container.querySelector('td')?.getAttribute('colspan')).toBe('3');
    });
});
