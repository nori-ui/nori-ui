/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { HStack } from '../../HStack';
import { Text } from '../../Text';
import { Separator } from '../Separator';

describe('<Separator>', () => {
    it('defaults to horizontal + decorative (role="none", no aria-orientation)', () => {
        render(<Separator testID="sep" />);
        const el = screen.getByTestId('sep');
        expect(el.getAttribute('role')).toBe('none');
        expect(el.getAttribute('aria-orientation')).toBeNull();
    });

    it('exposes role="separator" + aria-orientation when not decorative', () => {
        render(<Separator decorative={false} orientation="vertical" testID="sep" />);
        const el = screen.getByTestId('sep');
        expect(el.getAttribute('role')).toBe('separator');
        expect(el.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('forwards className', () => {
        render(<Separator className="my-4" testID="sep" />);
        expect(screen.getByTestId('sep').className).toContain('my-4');
    });

    // ------------------------------------------------------------------
    // Visibility regression guard. The vertical Separator collapsed to
    // height: 0 in production because `height: 100%` on a flex item
    // with a content-sized parent resolves to 0px. The fix relies on a
    // non-zero `min-height` so the rule shows up regardless of parent
    // layout. Assert the rendered min-height is non-zero so a future
    // refactor that drops it fails this test loudly.
    // ------------------------------------------------------------------

    it('horizontal separator: renders the 1px hairline height', () => {
        render(<Separator testID="sep" />);
        const el = screen.getByTestId('sep') as HTMLElement;
        // RN-Web compiles inline { height: 1 } to a `r-height-...` class;
        // computed style reflects that. Assert the rendered height is
        // the 1px hairline, not 0.
        expect(getComputedStyle(el).height).toBe('1px');
    });

    it('vertical separator: ships a non-zero min-height fallback', () => {
        render(<Separator orientation="vertical" testID="sep" />);
        const el = screen.getByTestId('sep') as HTMLElement;
        // The min-height keeps the rule visible inline with text even
        // when the parent flex container provides no explicit height
        // (the bug we previously shipped — height: 100% of nothing = 0).
        const minH = getComputedStyle(el).minHeight;
        expect(minH).not.toBe('0px');
        expect(minH).not.toBe('');
    });

    it('vertical separator inside an HStack with text siblings stays visible', () => {
        // Reproduces the failure mode that shipped: HStack of text +
        // vertical separator + text, where the bug had separator
        // collapse to 0px. Asserts the visibility intent — non-zero
        // min-height + 1px width + non-transparent bg.
        render(
            <HStack className="items-center">
                <Text>Edit</Text>
                <Separator orientation="vertical" testID="sep" />
                <Text>Delete</Text>
            </HStack>
        );
        const el = screen.getByTestId('sep') as HTMLElement;
        // jsdom doesn't lay out flexbox so getComputedStyle().height is
        // unreliable for layout-derived sizes. Assert the *intent*
        // shipped: min-height > 0 ensures visibility downstream.
        const cs = getComputedStyle(el);
        expect(cs.minHeight).not.toBe('0px');
        expect(cs.minHeight).not.toBe('');
        // Width should be the 1px hairline (not collapsed).
        expect(cs.width).toBe('1px');
        // bg color is set (not transparent default).
        expect(cs.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });
});
