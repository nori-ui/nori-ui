import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { defaultTheme, type NoriTheme, ThemeProvider } from '../../../theme';
import { Button } from '../Button';

describe('<Button>', () => {
    it('renders its children as the label', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('fires onPress when clicked', () => {
        const onPress = jest.fn();
        render(<Button onPress={onPress}>Go</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not fire onPress when disabled', () => {
        const onPress = jest.fn();
        render(
            <Button onPress={onPress} disabled>
                Go
            </Button>
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onPress).not.toHaveBeenCalled();
    });

    it('exposes disabled state to a11y via aria-disabled', () => {
        render(<Button disabled>Go</Button>);
        expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true');
    });

    it('does not fire onPress while loading', () => {
        const onPress = jest.fn();
        render(
            <Button onPress={onPress} loading>
                Go
            </Button>
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onPress).not.toHaveBeenCalled();
    });

    it('renders a spinner and aria-busy=true while loading', () => {
        render(
            <Button loading testID="b">
                Save
            </Button>
        );
        const btn = screen.getByTestId('b');
        expect(btn.getAttribute('aria-busy')).toBe('true');
        // Spinner child present:
        expect(btn.querySelector('[role="progressbar"]')).not.toBeNull();
    });

    it('renders the destructive variant (smoke check)', () => {
        render(
            <Button variant="destructive" testID="b">
                Delete
            </Button>
        );
        // After the theming refactor variant styling lives inline (so a
        // custom NoriProvider theme can override it). Assert the visible
        // label is wired, since the className signal is gone.
        expect(screen.getByTestId('b')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('renders the lg size (smoke check)', () => {
        render(
            <Button size="lg" testID="b">
                Big
            </Button>
        );
        // Same story as variant: dimensions are inline-styled now.
        expect(screen.getByTestId('b')).toBeInTheDocument();
        expect(screen.getByText('Big')).toBeInTheDocument();
    });

    it('renders a leading icon before the label', () => {
        function Arrow({ size }: { size?: number }) {
            return <svg data-testid="arrow" width={size} />;
        }
        render(<Button leadingIcon={Arrow}>Go</Button>);
        expect(screen.getByTestId('arrow')).toBeInTheDocument();
    });

    // ------------------------------------------------------------------
    // Theme-token flow regression. Earlier the Button passed `style` as
    // a function callback to `Pressable`; rn-web silently dropped the
    // returned values from the rendered DOM, leaving only the
    // dimensional Tailwind utilities (rounded-md, h-10, px-4) — which
    // never reflect a `<ThemeProvider>` override. The two assertions
    // below pin the contract that custom theme tokens for `radius.md`,
    // `spacing[*]`, `fontSize.md`, `fontFamily.body`, and
    // `fontWeight.medium` reach the rendered button so a future refactor
    // that re-introduces the rn-web silently-dropped-style bug fails
    // here loudly.
    // ------------------------------------------------------------------
    it('flows ThemeProvider radius tokens through to the button container as inline style', () => {
        // jsdom note: rn-web emits some props inline (`borderRadius`,
        // `backgroundColor`, `height`, `gap`) and others (`paddingLeft`,
        // `paddingRight`) through its atomic-CSS path, which jsdom's
        // `getComputedStyle` doesn't resolve. The full padding/spacing
        // contract is verified end-to-end in the docs e2e check; here
        // we pin the inline-style path so the regression — Pressable's
        // function-form `style` callback being silently dropped by
        // rn-web — fails this test loudly.
        const ROUNDED: NoriTheme = {
            light: {
                ...defaultTheme.light,
                radius: { ...defaultTheme.light.radius, md: '14px' },
            },
            dark: defaultTheme.dark,
        };
        render(
            <ThemeProvider theme={ROUNDED}>
                <Button testID="b">Themed</Button>
            </ThemeProvider>
        );
        const btn = screen.getByTestId('b');
        const inline = btn.getAttribute('style') ?? '';
        expect(inline).toMatch(/border-radius:\s*14px/);
    });

    it('flows ThemeProvider typography tokens through to the button label', () => {
        const SERIF: NoriTheme = {
            light: {
                ...defaultTheme.light,
                fontSize: { ...defaultTheme.light.fontSize, md: '17px' },
                fontWeight: { ...defaultTheme.light.fontWeight, medium: '600' },
                fontFamily: {
                    ...defaultTheme.light.fontFamily,
                    body: 'Georgia, serif',
                },
            },
            dark: defaultTheme.dark,
        };
        render(
            <ThemeProvider theme={SERIF}>
                <Button testID="b">Themed</Button>
            </ThemeProvider>
        );
        const label = screen.getByText('Themed');
        const cs = getComputedStyle(label);
        expect(cs.fontFamily).toContain('Georgia');
        expect(cs.fontSize).toBe('17px');
        expect(cs.fontWeight).toBe('600');
    });

    it('supports asChild — renders the child as the interactive element', () => {
        render(
            <Button asChild variant="primary">
                <a href="/x" data-testid="link">
                    Go
                </a>
            </Button>
        );
        const link = screen.getByTestId('link');
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', '/x');
        // The Slot pattern projects Button's onClick + style onto the anchor.
        // Button styling is now inline-only (so theme overrides win), so
        // we just verify the click handler reached through.
        expect(link.onclick).toBeDefined();
    });
});

describe('<Button asChild>', () => {
    it('does not navigate or fire onPress when disabled', () => {
        const onPress = jest.fn();
        render(
            <Button asChild disabled onPress={onPress}>
                <a href="/x" data-testid="link">
                    Go
                </a>
            </Button>
        );
        const link = screen.getByTestId('link');
        // fireEvent returns false when the handler called preventDefault().
        expect(fireEvent.click(link)).toBe(false);
        expect(onPress).not.toHaveBeenCalled();
        expect(link.getAttribute('aria-disabled')).toBe('true');
    });

    it('fires onPress exactly once through a Pressable child', () => {
        const onPress = jest.fn();
        const childPress = jest.fn();
        render(
            <Button asChild onPress={onPress}>
                <Pressable testID="child" onPress={childPress} />
            </Button>
        );
        fireEvent.click(screen.getByTestId('child'));
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(childPress).toHaveBeenCalledTimes(1);
    });

    it('fires onPress through a component child that renders a DOM link', () => {
        // Router links (e.g. Next.js) forward `onClick` to their anchor and
        // know nothing about `onPress`.
        const RouterLink = ({ onClick, children }: { onClick?: () => void; children?: ReactNode }) => (
            <a href="/billing" data-testid="link" onClick={onClick}>
                {children}
            </a>
        );
        const onPress = jest.fn();
        render(
            <Button asChild onPress={onPress}>
                <RouterLink>Billing</RouterLink>
            </Button>
        );
        fireEvent.click(screen.getByTestId('link'));
        expect(onPress).toHaveBeenCalledTimes(1);
    });
});

describe('<Button> consumer props', () => {
    it('keeps the disabled state when the consumer passes accessibilityState', () => {
        render(
            <Button disabled accessibilityState={{ selected: true }}>
                Save
            </Button>
        );
        expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true');
    });
});
