import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Slider } from '../Slider';

describe('<Slider>', () => {
    it('renders one thumb per value (single + range)', () => {
        const { unmount } = render(<Slider defaultValue={[40]} aria-label="Volume" />);
        expect(screen.getAllByRole('slider')).toHaveLength(1);
        unmount();
        render(<Slider defaultValue={[20, 80]} aria-label="Range" />);
        expect(screen.getAllByRole('slider')).toHaveLength(2);
    });

    it('clamps value to [min, max]', () => {
        render(<Slider defaultValue={[150]} min={0} max={100} aria-label="Volume" />);
        expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('100');
    });

    it('snaps value to step', () => {
        render(<Slider defaultValue={[33]} min={0} max={100} step={10} aria-label="Volume" />);
        // 33 → snaps to 30
        expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('30');
    });

    it('ArrowRight increments by step (uncontrolled)', () => {
        render(<Slider defaultValue={[40]} step={5} aria-label="Volume" />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        expect(thumb.getAttribute('aria-valuenow')).toBe('45');
    });

    it('ArrowLeft decrements by step', () => {
        render(<Slider defaultValue={[40]} step={5} aria-label="Volume" />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'ArrowLeft' });
        expect(thumb.getAttribute('aria-valuenow')).toBe('35');
    });

    it('Home / End jump to min / max', () => {
        render(<Slider defaultValue={[40]} min={0} max={100} aria-label="Volume" />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'End' });
        expect(thumb.getAttribute('aria-valuenow')).toBe('100');
        fireEvent.keyDown(thumb, { key: 'Home' });
        expect(thumb.getAttribute('aria-valuenow')).toBe('0');
    });

    it('PageUp / PageDown change by 10·step or 10% of range, whichever is larger', () => {
        render(<Slider defaultValue={[40]} min={0} max={100} step={1} aria-label="Volume" />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'PageUp' });
        // step*10=10, range/10=10 → +10
        expect(thumb.getAttribute('aria-valuenow')).toBe('50');
        fireEvent.keyDown(thumb, { key: 'PageDown' });
        expect(thumb.getAttribute('aria-valuenow')).toBe('40');
    });

    it('controlled: respects parent value, fires onValueChange', () => {
        const Wrapper = () => {
            const [v, setV] = useState<number[]>([20]);
            return (
                <>
                    <span data-testid="cur">{v[0]}</span>
                    <Slider value={v} onValueChange={setV} step={5} aria-label="Volume" />
                </>
            );
        };
        render(<Wrapper />);
        fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
        expect(screen.getByTestId('cur').textContent).toBe('25');
    });

    it('disabled: arrow keys do not change value', () => {
        render(<Slider defaultValue={[40]} disabled aria-label="Volume" />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        expect(thumb.getAttribute('aria-valuenow')).toBe('40');
    });

    it('range: thumbs cannot pass each other when minStepsBetweenThumbs=0', () => {
        render(<Slider defaultValue={[40, 50]} step={5} aria-label="Range" />);
        const [low, high] = screen.getAllByRole('slider');
        // Low can't go past high (50)
        for (let i = 0; i < 10; i += 1) fireEvent.keyDown(low as Element, { key: 'ArrowRight' });
        expect((low as HTMLElement).getAttribute('aria-valuenow')).toBe('50');
        expect((high as HTMLElement).getAttribute('aria-valuenow')).toBe('50');
    });

    it('minStepsBetweenThumbs enforces a gap', () => {
        render(<Slider defaultValue={[20, 80]} step={1} minStepsBetweenThumbs={10} aria-label="Range" />);
        const [low] = screen.getAllByRole('slider');
        for (let i = 0; i < 200; i += 1) fireEvent.keyDown(low as Element, { key: 'ArrowRight' });
        // Low capped at high - 10 = 70.
        expect((low as HTMLElement).getAttribute('aria-valuenow')).toBe('70');
    });

    it('exposes role="slider" with aria-orientation, valuemin/max/now', () => {
        render(<Slider defaultValue={[40]} min={0} max={100} aria-label="Volume" orientation="vertical" />);
        const thumb = screen.getByRole('slider');
        expect(thumb.getAttribute('aria-orientation')).toBe('vertical');
        expect(thumb.getAttribute('aria-valuemin')).toBe('0');
        expect(thumb.getAttribute('aria-valuemax')).toBe('100');
        expect(thumb.getAttribute('aria-valuenow')).toBe('40');
    });

    it('RTL: ArrowRight decreases value (visual right = lower)', () => {
        render(<Slider defaultValue={[40]} step={5} dir="rtl" aria-label="Volume" />);
        const thumb = screen.getByRole('slider');
        fireEvent.keyDown(thumb, { key: 'ArrowRight' });
        expect(thumb.getAttribute('aria-valuenow')).toBe('35');
    });
});
