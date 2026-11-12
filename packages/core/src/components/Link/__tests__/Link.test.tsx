import { act, fireEvent, render, screen } from '@testing-library/react';
import { NoriProvider } from '../../../provider';
import { Link } from '../Link';

// The shared jsdom setup replaces `react-native` with a mock that forwards
// every prop to the DOM. A link is defined by what react-native-web really
// emits (`<a>`, `target`, `rel`), so these tests run against the real thing.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

describe('<Link>', () => {
    it('renders a real anchor with the href and its text as accessible name', () => {
        render(<Link href="/docs">Documentation</Link>);
        const link = screen.getByRole('link', { name: 'Documentation' });
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', '/docs');
        expect(link).not.toHaveAttribute('target');
    });

    it('external: opens in a new tab safely and says so in the accessible name', () => {
        render(
            <Link href="https://example.com" external>
                Example
            </Link>
        );
        const link = screen.getByRole('link', { name: 'Example, opens in a new tab' });
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('external: the new-tab hint is translatable', () => {
        render(
            <NoriProvider i18n={{ 'link.opensInNewTab': 'öffnet in neuem Tab' }}>
                <Link href="https://example.com" external>
                    Beispiel
                </Link>
            </NoriProvider>
        );
        expect(screen.getByRole('link', { name: 'Beispiel, öffnet in neuem Tab' })).toBeInTheDocument();
    });

    it('onPress replaces navigation on a plain click', () => {
        const onPress = jest.fn();
        render(
            <Link href="/docs" onPress={onPress}>
                Docs
            </Link>
        );
        // fireEvent returns false when the handler called preventDefault.
        const notCanceled = fireEvent.click(screen.getByRole('link'));
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(notCanceled).toBe(false);
    });

    it('leaves modified clicks to the browser so Cmd/Ctrl-click opens a new tab', () => {
        const onPress = jest.fn();
        render(
            <Link href="/docs" onPress={onPress}>
                Docs
            </Link>
        );
        const notCanceled = fireEvent.click(screen.getByRole('link'), { metaKey: true });
        expect(onPress).not.toHaveBeenCalled();
        expect(notCanceled).toBe(true);
    });

    it('without href: is a tab stop and activates on Enter', () => {
        const onPress = jest.fn();
        render(<Link onPress={onPress}>Retry</Link>);
        const link = screen.getByRole('link', { name: 'Retry' });
        expect(link).toHaveAttribute('tabindex', '0');
        fireEvent.keyDown(link, { key: 'Enter' });
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('disabled: cannot be followed or pressed and is announced as disabled', () => {
        const onPress = jest.fn();
        render(
            <Link href="/docs" onPress={onPress} disabled>
                Docs
            </Link>
        );
        const link = screen.getByRole('link', { name: 'Docs' });
        expect(link).not.toHaveAttribute('href');
        expect(link).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(link);
        expect(onPress).not.toHaveBeenCalled();
    });

    it('underline="hover" shows the underline on hover only', () => {
        render(
            <Link href="/docs" underline="hover">
                Docs
            </Link>
        );
        const link = screen.getByRole('link');
        expect(link.style.textDecoration).not.toBe('underline');
        fireEvent.mouseEnter(link);
        expect(link.style.textDecoration).toBe('underline');
        fireEvent.mouseLeave(link);
        expect(link.style.textDecoration).not.toBe('underline');
    });

    it('underline="none" never underlines, underline="always" always does', () => {
        render(
            <>
                <Link href="/a" underline="none">
                    None
                </Link>
                <Link href="/b">Always</Link>
            </>
        );
        const none = screen.getByRole('link', { name: 'None' });
        fireEvent.mouseEnter(none);
        expect(none.style.textDecoration).not.toBe('underline');
        expect(screen.getByRole('link', { name: 'Always' }).style.textDecoration).toBe('underline');
    });

    it('shows a focus ring while focused and removes it on blur', () => {
        render(<Link href="/docs">Docs</Link>);
        const link = screen.getByRole('link');
        expect(link.getAttribute('style')).not.toContain('outline');
        act(() => link.focus());
        expect(link.getAttribute('style')).toContain('outline');
        act(() => link.blur());
        expect(link.getAttribute('style')).not.toContain('outline');
    });

    it('size="inherit" sets no font size so the surrounding text decides', () => {
        render(
            <>
                <Link href="/a" size="inherit">
                    Inherit
                </Link>
                <Link href="/b" size="sm">
                    Small
                </Link>
            </>
        );
        expect(screen.getByRole('link', { name: 'Inherit' }).style.fontSize).toBe('');
        expect(screen.getByRole('link', { name: 'Small' }).style.fontSize).not.toBe('');
    });

    it('asChild: styles the child anchor instead of nesting a second link', () => {
        render(
            <Link asChild external testID="router-link">
                <a href="/dashboard">Dashboard</a>
            </Link>
        );
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(1);
        const link = screen.getByTestId('router-link');
        expect(link).toHaveAttribute('href', '/dashboard');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link.style.color).not.toBe('');
    });

    it('forwards testID', () => {
        render(
            <Link href="/docs" testID="docs-link">
                Docs
            </Link>
        );
        expect(screen.getByTestId('docs-link')).toHaveAttribute('href', '/docs');
    });
});
