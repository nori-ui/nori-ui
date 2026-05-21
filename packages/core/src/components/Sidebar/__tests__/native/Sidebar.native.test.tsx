import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { NoriProvider } from '../../../../provider';
import { Sidebar } from '../../Sidebar';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

function HomeIcon() {
    return <View testID="home-icon" />;
}

describe('<Sidebar> native', () => {
    it('renders all compound parts', () => {
        const { getByText, getByTestId } = render(
            wrap(
                <Sidebar testID="sidebar">
                    <Sidebar.Header testID="sidebar-header">
                        <Text>Acme Inc.</Text>
                    </Sidebar.Header>
                    <Sidebar.Content testID="sidebar-content">
                        <Sidebar.Group testID="sidebar-group">
                            <Sidebar.GroupLabel>Main</Sidebar.GroupLabel>
                            <Sidebar.Menu testID="sidebar-menu">
                                <Sidebar.MenuItem icon={<HomeIcon />} onPress={() => {}}>
                                    Home
                                </Sidebar.MenuItem>
                            </Sidebar.Menu>
                        </Sidebar.Group>
                    </Sidebar.Content>
                    <Sidebar.Footer testID="sidebar-footer">
                        <Text>Logout</Text>
                    </Sidebar.Footer>
                </Sidebar>
            )
        );

        expect(getByTestId('sidebar-header')).toBeTruthy();
        expect(getByTestId('sidebar-content')).toBeTruthy();
        expect(getByTestId('sidebar-group')).toBeTruthy();
        expect(getByTestId('sidebar-menu')).toBeTruthy();
        expect(getByTestId('sidebar-footer')).toBeTruthy();
        expect(getByText('Acme Inc.')).toBeTruthy();
        expect(getByText('Logout')).toBeTruthy();
    });

    it('renders GroupLabel text on native (always visible — no collapse on native v1)', () => {
        const { getByText } = render(
            wrap(
                <Sidebar>
                    <Sidebar.Content>
                        <Sidebar.Group>
                            <Sidebar.GroupLabel>Main Section</Sidebar.GroupLabel>
                            <Sidebar.Menu>
                                <Sidebar.MenuItem onPress={() => {}}>Home</Sidebar.MenuItem>
                            </Sidebar.Menu>
                        </Sidebar.Group>
                    </Sidebar.Content>
                </Sidebar>
            )
        );
        expect(getByText('Main Section')).toBeTruthy();
    });

    it('renders icon inside MenuItem on native', () => {
        const { getByTestId } = render(
            wrap(
                <Sidebar>
                    <Sidebar.Content>
                        <Sidebar.Group>
                            <Sidebar.Menu>
                                <Sidebar.MenuItem icon={<HomeIcon />} onPress={() => {}}>
                                    Home
                                </Sidebar.MenuItem>
                            </Sidebar.Menu>
                        </Sidebar.Group>
                    </Sidebar.Content>
                </Sidebar>
            )
        );
        expect(getByTestId('home-icon')).toBeTruthy();
    });

    it('active item renders with selected accessibilityState', () => {
        const { getByTestId } = render(
            wrap(
                <Sidebar>
                    <Sidebar.Content>
                        <Sidebar.Group>
                            <Sidebar.Menu>
                                <Sidebar.MenuItem testID="active-item" active onPress={() => {}}>
                                    Active
                                </Sidebar.MenuItem>
                            </Sidebar.Menu>
                        </Sidebar.Group>
                    </Sidebar.Content>
                </Sidebar>
            )
        );
        const item = getByTestId('active-item');
        expect(item.props.accessibilityState?.selected).toBe(true);
    });
});
