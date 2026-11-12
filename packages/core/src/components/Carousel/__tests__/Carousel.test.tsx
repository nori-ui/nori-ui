import { act, fireEvent, render, screen } from '@testing-library/react';
import { Carousel } from '../Carousel';

// jsdom returns zero-width elements by default. Give the list a measurable size
// so scroll position math works.
beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        get() {
            return 400;
        },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollLeft', {
        configurable: true,
        writable: true,
        value: 0,
    });
    // jsdom does not lay out or scroll; move the list the way a browser would.
    Element.prototype.scrollTo = function scrollTo(this: Element, options?: ScrollToOptions | number) {
        if (typeof options === 'object') {
            this.scrollLeft = options.left ?? this.scrollLeft;
        }
    } as Element['scrollTo'];
});

type BasicCarouselProps = {
    loop?: boolean;
    index?: number;
    defaultIndex?: number;
    onIndexChange?: (index: number) => void;
};

function BasicCarousel({ loop = false, ...rest }: BasicCarouselProps) {
    return (
        <Carousel loop={loop} testID="carousel" {...rest}>
            <Carousel.Content testID="content">
                <Carousel.Item testID="slide-1">Slide 1</Carousel.Item>
                <Carousel.Item testID="slide-2">Slide 2</Carousel.Item>
                <Carousel.Item testID="slide-3">Slide 3</Carousel.Item>
            </Carousel.Content>
            <Carousel.Previous testID="btn-prev" />
            <Carousel.Next testID="btn-next" />
            <Carousel.Dots testID="dots" />
        </Carousel>
    );
}

describe('<Carousel>', () => {
    it('renders all slides', () => {
        render(<BasicCarousel />);
        expect(screen.getByTestId('slide-1')).toBeInTheDocument();
        expect(screen.getByTestId('slide-2')).toBeInTheDocument();
        expect(screen.getByTestId('slide-3')).toBeInTheDocument();
    });

    it('renders prev + next buttons', () => {
        render(<BasicCarousel />);
        expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument();
    });

    it('prev button is disabled at index 0 when not looping', () => {
        render(<BasicCarousel />);
        expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
    });

    it('next button is not disabled at index 0', () => {
        render(<BasicCarousel />);
        expect(screen.getByRole('button', { name: 'Next slide' })).not.toBeDisabled();
    });

    it('clicking next moves to the second slide', () => {
        const onIndexChange = jest.fn();
        render(<BasicCarousel onIndexChange={onIndexChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
        expect(onIndexChange).toHaveBeenCalledWith(1);
        expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('content').scrollLeft).toBe(400);
    });

    it('when loop=true, prev is enabled at index 0', () => {
        render(<BasicCarousel loop />);
        expect(screen.getByRole('button', { name: 'Previous slide' })).not.toBeDisabled();
    });

    it('renders dot navigation with correct count', () => {
        render(<BasicCarousel />);
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);
    });

    it('first dot is selected initially', () => {
        render(<BasicCarousel />);
        const tabs = screen.getAllByRole('tab');
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
        expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });

    it('clicking a dot scrolls to its slide', () => {
        render(<BasicCarousel />);
        fireEvent.click(screen.getAllByRole('tab')[2] as HTMLElement);
        expect(screen.getByTestId('content').scrollLeft).toBe(800);
        expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
    });

    it('defaultIndex shows that slide, not just its dot', () => {
        render(<BasicCarousel defaultIndex={2} />);
        expect(screen.getByTestId('content').scrollLeft).toBe(800);
    });

    it('a parent-driven index scrolls the list', () => {
        const { rerender } = render(<BasicCarousel index={0} />);
        rerender(<BasicCarousel index={1} />);
        expect(screen.getByTestId('content').scrollLeft).toBe(400);
    });

    it('does not report the slides a programmatic scroll passes on its way', () => {
        jest.useFakeTimers();
        try {
            const onIndexChange = jest.fn();
            render(<BasicCarousel onIndexChange={onIndexChange} />);
            const content = screen.getByTestId('content');
            fireEvent.click(screen.getAllByRole('tab')[2] as HTMLElement);
            // A smooth scroll passes slide 1 before it arrives at slide 2.
            content.scrollLeft = 400;
            fireEvent.scroll(content);
            content.scrollLeft = 800;
            fireEvent.scroll(content);
            act(() => {
                jest.advanceTimersByTime(500);
            });
            expect(onIndexChange.mock.calls).toEqual([[2]]);

            // Once it has settled, the user's own scrolling is followed again.
            content.scrollLeft = 0;
            fireEvent.scroll(content);
            expect(onIndexChange).toHaveBeenLastCalledWith(0);
        } finally {
            jest.useRealTimers();
        }
    });

    it('is named "Carousel" rather than after its test id', () => {
        render(<BasicCarousel />);
        expect(screen.getByRole('region', { name: 'Carousel' })).toBeInTheDocument();
    });

    it('content has scroll-snap styles', () => {
        render(<BasicCarousel />);
        const content = screen.getByTestId('content');
        // The scrollSnapType style is set inline
        expect(content).toHaveStyle({ scrollSnapType: 'x mandatory' });
    });
});
