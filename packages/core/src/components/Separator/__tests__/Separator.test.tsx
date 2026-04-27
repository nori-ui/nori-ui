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

    it('vertical separator: ships an explicit non-zero height (visibility floor)', () => {
        render(<Separator orientation="vertical" testID="sep" />);
        const el = screen.getByTestId('sep') as HTMLElement;
        // The previous regression had `height: '100%'` collapsing to 0px
        // in content-sized parents (height: 100% of nothing = 0). The
        // current design ships a fixed pixel height that matches the
        // body text glyph height, so the rule is always visible.
        const h = getComputedStyle(el).height;
        expect(h).not.toBe('0px');
        expect(h).not.toBe('');
        // 1em-of-body-text intent — pixel value pinned by the component.
        // If you bump the value in code, update the assertion to match
        // intentionally; the assertion exists to make a regression LOUD.
        expect(h).toBe('16px');
    });

    it('vertical separator: align-self is center (not stretch) so it sits aligned with text glyphs', () => {
        render(<Separator orientation="vertical" testID="sep" />);
        const el = screen.getByTestId('sep') as HTMLElement;
        // The earlier (broken) design used align-self: stretch, which
        // pulled the rule to the full row height and made it look
        // oversized + asymmetric against text in inline rows. Center
        // matches the text glyph zone visually.
        expect(getComputedStyle(el).alignSelf).toBe('center');
    });

    it('vertical separator inside an HStack with text siblings stays visible', () => {
        // Reproduces the failure mode that shipped: HStack of text +
        // vertical separator + text, where the bug had separator
        // collapse to 0px. Asserts the visibility intent end-to-end —
        // non-zero height + 1px width + non-transparent bg.
        render(
            <HStack className="items-center">
                <Text>Edit</Text>
                <Separator orientation="vertical" testID="sep" />
                <Text>Delete</Text>
            </HStack>
        );
        const el = screen.getByTestId('sep') as HTMLElement;
        const cs = getComputedStyle(el);
        // Width should be the 1px hairline (not collapsed).
        expect(cs.width).toBe('1px');
        // Height should be the explicit pixel value (not 0).
        expect(cs.height).toBe('16px');
        // Centered alignment, not stretched.
        expect(cs.alignSelf).toBe('center');
        // bg color is set (not transparent default).
        expect(cs.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });
});
