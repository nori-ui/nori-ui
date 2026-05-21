import { fireEvent, render, screen } from '@testing-library/react';
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
    // scrollIntoView is not implemented in jsdom
    Element.prototype.scrollIntoView = jest.fn();
});

function BasicCarousel({ loop = false }: { loop?: boolean }) {
    return (
        <Carousel loop={loop} testID="carousel">
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

    it('clicking next advances index (scrollIntoView called)', () => {
        render(<BasicCarousel />);
        const next = screen.getByRole('button', { name: 'Next slide' });
        fireEvent.click(next);
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
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

    it('clicking a dot calls scrollTo (scrollIntoView invoked)', () => {
        (Element.prototype.scrollIntoView as jest.Mock).mockClear();
        render(<BasicCarousel />);
        const tabs = screen.getAllByRole('tab');
        fireEvent.click(tabs[2]);
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it('content has scroll-snap styles', () => {
        render(<BasicCarousel />);
        const content = screen.getByTestId('content');
        // The scrollSnapType style is set inline
        expect(content).toHaveStyle({ scrollSnapType: 'x mandatory' });
    });
});
