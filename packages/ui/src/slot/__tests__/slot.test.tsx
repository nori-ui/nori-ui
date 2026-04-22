import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, forwardRef } from 'react';
import { Slot } from '../slot';

describe('<Slot>', () => {
    it('renders the single child, passing Slot props down', () => {
        render(
            <Slot data-testid="slot" className="outer">
                <button type="button" className="inner">
                    click
                </button>
            </Slot>
        );
        const btn = screen.getByTestId('slot');
        expect(btn.tagName).toBe('BUTTON');
        expect(btn).toHaveClass('inner');
        expect(btn).toHaveClass('outer');
    });

    it('merges className in "outer inner" order so child wins on conflicts', () => {
        render(
            <Slot className="outer">
                <span className="inner" data-testid="s" />
            </Slot>
        );
        expect(screen.getByTestId('s').className).toBe('outer inner');
    });

    it('forwards refs to the child DOM node', () => {
        const ref = createRef<HTMLButtonElement>();
        render(
            <Slot ref={ref}>
                <button type="button">x</button>
            </Slot>
        );
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('merges refs when child already has one', () => {
        const outer = createRef<HTMLButtonElement>();
        const inner = createRef<HTMLButtonElement>();
        render(
            <Slot ref={outer}>
                <button type="button" ref={inner}>
                    x
                </button>
            </Slot>
        );
        expect(outer.current).toBeInstanceOf(HTMLButtonElement);
        expect(inner.current).toBe(outer.current);
    });

    it('composes event handlers — both outer and inner onClick fire, outer first', () => {
        const outer = jest.fn();
        const inner = jest.fn();
        render(
            <Slot onClick={outer}>
                <button type="button" onClick={inner} data-testid="s">
                    x
                </button>
            </Slot>
        );
        fireEvent.click(screen.getByTestId('s'));
        expect(outer).toHaveBeenCalledTimes(1);
        expect(inner).toHaveBeenCalledTimes(1);
    });

    it('passes style objects with outer as base, inner overriding', () => {
        render(
            <Slot style={{ color: 'red', fontSize: 14 }}>
                <span style={{ color: 'blue' }} data-testid="s" />
            </Slot>
        );
        const el = screen.getByTestId('s');
        expect(el).toHaveStyle({ color: 'blue', fontSize: '14px' });
    });

    it('accepts polymorphic children — e.g. a custom component that forwards props', () => {
        const MyLink = forwardRef<HTMLAnchorElement, { className?: string; children?: React.ReactNode; href?: string }>(
            function MyLink({ className, href, children }, ref) {
                return (
                    <a ref={ref} className={className} href={href} data-testid="link">
                        {children}
                    </a>
                );
            }
        );
        MyLink.displayName = 'MyLink';

        render(
            <Slot className="styled">
                <MyLink href="/x">go</MyLink>
            </Slot>
        );
        const link = screen.getByTestId('link');
        expect(link).toHaveClass('styled');
        expect(link).toHaveAttribute('href', '/x');
    });
});
