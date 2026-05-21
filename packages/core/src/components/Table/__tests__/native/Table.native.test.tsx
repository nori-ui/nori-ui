import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { NoriProvider } from '../../../../provider';
import { Table } from '../../Table.native';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

describe('<Table> native', () => {
    it('renders rows and cells without crashing', () => {
        const { getByText } = render(
            wrap(
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Name</Table.HeaderCell>
                            <Table.HeaderCell>Status</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        <Table.Row>
                            <Table.Cell>Alice</Table.Cell>
                            <Table.Cell>Active</Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            )
        );
        expect(getByText('Alice')).toBeTruthy();
        expect(getByText('Active')).toBeTruthy();
    });

    it('renders header cell text', () => {
        const { getByText } = render(
            wrap(
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Invoice</Table.HeaderCell>
                            <Table.HeaderCell>Amount</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        <Table.Row>
                            <Table.Cell>INV-001</Table.Cell>
                            <Table.Cell>$250</Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            )
        );
        expect(getByText('Invoice')).toBeTruthy();
        expect(getByText('Amount')).toBeTruthy();
        expect(getByText('INV-001')).toBeTruthy();
    });

    it('renders caption text', () => {
        const { getByText } = render(
            wrap(
                <Table>
                    <Table.Caption>My caption</Table.Caption>
                    <Table.Body>
                        <Table.Row>
                            <Table.Cell>data</Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            )
        );
        expect(getByText('My caption')).toBeTruthy();
    });

    it('all compound parts mount without crashing', () => {
        expect(() =>
            render(
                wrap(
                    <Table striped compact bordered>
                        <Table.Caption>Caption</Table.Caption>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell>H1</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            <Table.Row>
                                <Table.Cell>B1</Table.Cell>
                            </Table.Row>
                        </Table.Body>
                        <Table.Footer>
                            <Table.Row>
                                <Table.Cell>F1</Table.Cell>
                            </Table.Row>
                        </Table.Footer>
                    </Table>
                )
            )
        ).not.toThrow();
    });
});
