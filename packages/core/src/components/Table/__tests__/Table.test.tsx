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

    it('activates a pressable row from the keyboard', () => {
        const handler = jest.fn();
        render(
            <Table>
                <Table.Body>
                    <Table.Row onPress={handler}>
                        <Table.Cell>open me</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
        const row = screen.getByRole('row');
        expect(row).toHaveAttribute('tabindex', '0');
        fireEvent.keyDown(row, { key: 'Enter' });
        fireEvent.keyDown(row, { key: ' ' });
        expect(handler).toHaveBeenCalledTimes(2);
    });

    it('striped tints every second body row', () => {
        render(
            <Table striped>
                <Table.Body>
                    <Table.Row testID="r1">
                        <Table.Cell>one</Table.Cell>
                    </Table.Row>
                    <Table.Row testID="r2">
                        <Table.Cell>two</Table.Cell>
                    </Table.Row>
                    <Table.Row testID="r3">
                        <Table.Cell>three</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
        expect(screen.getByTestId('r1').style.backgroundColor).toBe('');
        expect(screen.getByTestId('r2').style.backgroundColor).not.toBe('');
        expect(screen.getByTestId('r3').style.backgroundColor).toBe('');
    });

    it('compact reduces cell padding', () => {
        render(
            <Table compact>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell testID="cell">dense</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table>
        );
        expect(screen.getByTestId('cell').className).toContain('py-2');
        expect(screen.getByTestId('cell').className).not.toContain('p-4');
    });
});
