import { fireEvent, render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

function HomeIcon() {
    return <svg data-testid="home-icon" aria-hidden="true" />;
}

function UsersIcon() {
    return <svg data-testid="users-icon" aria-hidden="true" />;
}

describe('<Sidebar> web', () => {
    it('renders compound parts', () => {
        render(
            <Sidebar testID="sidebar">
                <Sidebar.Header testID="sidebar-header">Header</Sidebar.Header>
                <Sidebar.Content testID="sidebar-content">
                    <Sidebar.Group testID="sidebar-group">
                        <Sidebar.GroupLabel testID="sidebar-label">Main</Sidebar.GroupLabel>
                        <Sidebar.Menu testID="sidebar-menu">
                            <Sidebar.MenuItem testID="menu-item-home" onPress={() => {}}>
                                Home
                            </Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                </Sidebar.Content>
                <Sidebar.Footer testID="sidebar-footer">Footer</Sidebar.Footer>
            </Sidebar>
        );

        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-group')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-label')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument();
        expect(screen.getByTestId('menu-item-home')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();
    });

    it('clicking MenuItem fires onPress', () => {
        const onPress = jest.fn();
        render(
            <Sidebar>
                <Sidebar.Content>
                    <Sidebar.Group>
                        <Sidebar.Menu>
                            <Sidebar.MenuItem testID="item" onPress={onPress}>
                                Click me
                            </Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                </Sidebar.Content>
            </Sidebar>
        );
        fireEvent.click(screen.getByTestId('item'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('collapsed sidebar hides GroupLabel text', () => {
        render(
            <Sidebar defaultCollapsed>
                <Sidebar.Content>
                    <Sidebar.Group>
                        <Sidebar.GroupLabel testID="label">Hidden Section</Sidebar.GroupLabel>
                        <Sidebar.Menu>
                            <Sidebar.MenuItem icon={<HomeIcon />} onPress={() => {}}>
                                Home
                            </Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                </Sidebar.Content>
            </Sidebar>
        );
        // GroupLabel returns null when collapsed
        expect(screen.queryByTestId('label')).toBeNull();
    });

    it('collapsed sidebar hides item labels but keeps icons', () => {
        render(
            <Sidebar defaultCollapsed>
                <Sidebar.Content>
                    <Sidebar.Group>
                        <Sidebar.Menu>
                            <Sidebar.MenuItem testID="item" icon={<HomeIcon />} onPress={() => {}}>
                                Home
                            </Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                </Sidebar.Content>
            </Sidebar>
        );
        // The icon should still be present
        expect(screen.getByTestId('home-icon')).toBeInTheDocument();
        // The label text is hidden (not in document)
        expect(screen.queryByText('Home')).toBeNull();
    });

    it('active MenuItem has aria-current="page"', () => {
        render(
            <Sidebar>
                <Sidebar.Content>
                    <Sidebar.Group>
                        <Sidebar.Menu>
                            <Sidebar.MenuItem testID="active-item" active onPress={() => {}}>
                                Active
                            </Sidebar.MenuItem>
                            <Sidebar.MenuItem testID="inactive-item" onPress={() => {}}>
                                Inactive
                            </Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                </Sidebar.Content>
            </Sidebar>
        );
        expect(screen.getByTestId('active-item')).toHaveAttribute('aria-current', 'page');
        expect(screen.getByTestId('inactive-item')).not.toHaveAttribute('aria-current');
    });

    it('disabled MenuItem does not fire onPress', () => {
        const onPress = jest.fn();
        render(
            <Sidebar>
                <Sidebar.Content>
                    <Sidebar.Group>
                        <Sidebar.Menu>
                            <Sidebar.MenuItem testID="disabled-item" disabled onPress={onPress}>
                                Disabled
                            </Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                </Sidebar.Content>
            </Sidebar>
        );
        const item = screen.getByTestId('disabled-item');
        fireEvent.click(item);
        expect(onPress).not.toHaveBeenCalled();
    });

    it('sidebar has navigation landmark on web', () => {
        render(
            <Sidebar testID="sidebar">
                <Sidebar.Content>
                    <Sidebar.Group>
                        <Sidebar.Menu>
                            <Sidebar.MenuItem onPress={() => {}}>Item</Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                </Sidebar.Content>
            </Sidebar>
        );
        // <nav> has implicit role="navigation"; query it by role so we don't
        // rely on the explicit attribute (jsdom doesn't expose implicit roles
        // via getAttribute).
        expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('throws when MenuItem rendered outside Sidebar', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<Sidebar.MenuItem onPress={() => {}}>Item</Sidebar.MenuItem>)).toThrow(/Sidebar/);
        } finally {
            console.error = original;
        }
    });

    it('controlled: collapsed prop drives state', () => {
        const onCollapsedChange = jest.fn();
        render(
            <Sidebar collapsed={true} onCollapsedChange={onCollapsedChange}>
                <Sidebar.Content>
                    <Sidebar.Group>
                        <Sidebar.GroupLabel testID="label">Section</Sidebar.GroupLabel>
                        <Sidebar.Menu>
                            <Sidebar.MenuItem icon={<UsersIcon />} onPress={() => {}}>
                                Team
                            </Sidebar.MenuItem>
                        </Sidebar.Menu>
                    </Sidebar.Group>
                </Sidebar.Content>
            </Sidebar>
        );
        // Label is hidden when controlled collapsed=true
        expect(screen.queryByTestId('label')).toBeNull();
    });
});
