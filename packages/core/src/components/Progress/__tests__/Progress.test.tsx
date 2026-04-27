import { render, screen } from '@testing-library/react';
import { Progress } from '../Progress';

describe('<Progress>', () => {
    it('renders track + fill at the right percentage for a determinate value', () => {
        const { container } = render(<Progress value={42} aria-label="Loading" testID="p" />);
        const bar = screen.getByRole('progressbar');
        expect(bar.getAttribute('aria-valuenow')).toBe('42');
        expect(bar.getAttribute('aria-valuemin')).toBe('0');
        expect(bar.getAttribute('aria-valuemax')).toBe('100');
        // The fill should be a child div with width: 42%.
        const fills = Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
            (el) => el.style.width === '42%'
        );
        expect(fills.length).toBeGreaterThan(0);
    });

    it('omits aria-valuenow when indeterminate (no value)', () => {
        render(<Progress aria-label="Loading" />);
        const bar = screen.getByRole('progressbar');
        expect(bar.hasAttribute('aria-valuenow')).toBe(false);
        expect(bar.getAttribute('aria-valuemin')).toBe('0');
        expect(bar.getAttribute('aria-valuemax')).toBe('100');
    });

    it('clamps value to [0, max]', () => {
        const { unmount } = render(<Progress value={-50} aria-label="Underflow" />);
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
        unmount();
        render(<Progress value={500} max={100} aria-label="Overflow" />);
        expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    });

    it('respects a custom max — value/max drives the percentage', () => {
        const { container } = render(<Progress value={125} max={500} aria-label="Custom" />);
        const bar = screen.getByRole('progressbar');
        expect(bar.getAttribute('aria-valuemax')).toBe('500');
        expect(bar.getAttribute('aria-valuenow')).toBe('125');
        // 125 / 500 = 25%
        const fills = Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
            (el) => el.style.width === '25%'
        );
        expect(fills.length).toBeGreaterThan(0);
    });

    it('changes the fill color when tone changes', () => {
        const { container: cPrimary } = render(<Progress value={50} aria-label="P" tone="primary" />);
        const { container: cDanger } = render(<Progress value={50} aria-label="D" tone="danger" />);
        const findFill = (root: HTMLElement) =>
            Array.from(root.querySelectorAll<HTMLElement>('div')).find((el) => el.style.width === '50%');
        const primaryFill = findFill(cPrimary as unknown as HTMLElement);
        const dangerFill = findFill(cDanger as unknown as HTMLElement);
        expect(primaryFill).toBeDefined();
        expect(dangerFill).toBeDefined();
        // Different tones must produce different background colors — we don't
        // assert the exact hex (that's a token detail), just that they differ.
        expect(primaryFill?.style.backgroundColor).not.toBe('');
        expect(dangerFill?.style.backgroundColor).not.toBe('');
        expect(primaryFill?.style.backgroundColor).not.toBe(dangerFill?.style.backgroundColor);
    });

    it('changes the bar height when size changes', () => {
        const findTrack = (root: HTMLElement, height: string) =>
            Array.from(root.querySelectorAll<HTMLElement>('div')).find((el) => el.style.height === height);
        const { container: cSm } = render(<Progress value={50} aria-label="S" size="sm" />);
        const { container: cMd } = render(<Progress value={50} aria-label="M" size="md" />);
        const { container: cLg } = render(<Progress value={50} aria-label="L" size="lg" />);
        expect(findTrack(cSm as unknown as HTMLElement, '4px')).toBeDefined();
        expect(findTrack(cMd as unknown as HTMLElement, '8px')).toBeDefined();
        expect(findTrack(cLg as unknown as HTMLElement, '12px')).toBeDefined();
    });

    it('renders the visible label and percentage when label is provided', () => {
        render(<Progress value={42} label="Uploading" />);
        expect(screen.getByText('Uploading')).toBeInTheDocument();
        expect(screen.getByText('42%')).toBeInTheDocument();
    });

    it('hides the percentage when hidePercentage is set', () => {
        render(<Progress value={42} label="Step 3 of 5" hidePercentage />);
        expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
        expect(screen.queryByText('42%')).toBeNull();
    });

    it('does not render percentage for indeterminate even with a label', () => {
        render(<Progress label="Loading" />);
        expect(screen.getByText('Loading')).toBeInTheDocument();
        // No percentage suffix when there's no value.
        expect(screen.queryByText(/%/)).toBeNull();
    });

    it('uses label as the implicit aria-label when no aria-label is provided', () => {
        render(<Progress value={10} label="Saving" />);
        expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('Saving');
    });

    it('explicit aria-label wins over the visible label', () => {
        render(<Progress value={10} label="Saving" aria-label="File upload progress" />);
        expect(screen.getByRole('progressbar').getAttribute('aria-label')).toBe('File upload progress');
    });
});
