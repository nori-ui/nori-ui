import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Accordion } from '../Accordion';

// AccordionContent on web stays mounted (so the slide animation has
// something to transition between), and is hidden via aria-hidden +
// max-height: 0 on the wrapper. The "is this content visible to the
// user?" test therefore has to walk up to the role="region" wrapper and
// check aria-hidden, not just check whether the text is in the DOM.
const isContentHidden = (text: string): boolean => {
    const node = screen.queryByText(text);
    if (!node) {
        return true;
    }
    let el: HTMLElement | null = node;
    while (el && el.getAttribute('role') !== 'region') {
        el = el.parentElement;
    }
    return el?.getAttribute('aria-hidden') === 'true';
};

describe('<Accordion>', () => {
    it('renders all triggers; only the open item shows its content', () => {
        render(
            <Accordion type="single" defaultValue="b">
                <Accordion.Item value="a">
                    <Accordion.Trigger>A</Accordion.Trigger>
                    <Accordion.Content>A body</Accordion.Content>
                </Accordion.Item>
                <Accordion.Item value="b">
                    <Accordion.Trigger>B</Accordion.Trigger>
                    <Accordion.Content>B body</Accordion.Content>
                </Accordion.Item>
            </Accordion>
        );
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
        expect(isContentHidden('A body')).toBe(true);
        expect(screen.getByText('B body')).toBeInTheDocument();
    });

    it('single mode: clicking a closed trigger opens it and closes the previous one', () => {
        render(
            <Accordion type="single" defaultValue="a">
                <Accordion.Item value="a">
                    <Accordion.Trigger testID="trig-a">A</Accordion.Trigger>
                    <Accordion.Content>A body</Accordion.Content>
                </Accordion.Item>
                <Accordion.Item value="b">
                    <Accordion.Trigger testID="trig-b">B</Accordion.Trigger>
                    <Accordion.Content>B body</Accordion.Content>
                </Accordion.Item>
            </Accordion>
        );
        fireEvent.click(screen.getByTestId('trig-b'));
        expect(isContentHidden('A body')).toBe(true);
        expect(screen.getByText('B body')).toBeInTheDocument();
    });

    it('single mode (default): clicking the open trigger does nothing — at least one item stays open', () => {
        render(
            <Accordion type="single" defaultValue="a">
                <Accordion.Item value="a">
                    <Accordion.Trigger testID="trig-a">A</Accordion.Trigger>
                    <Accordion.Content>A body</Accordion.Content>
                </Accordion.Item>
            </Accordion>
        );
        fireEvent.click(screen.getByTestId('trig-a'));
        expect(screen.getByText('A body')).toBeInTheDocument();
    });

    it('single + collapsible: clicking the open trigger closes it', () => {
        render(
            <Accordion type="single" collapsible defaultValue="a">
                <Accordion.Item value="a">
                    <Accordion.Trigger testID="trig-a">A</Accordion.Trigger>
                    <Accordion.Content>A body</Accordion.Content>
                </Accordion.Item>
            </Accordion>
        );
        expect(screen.getByText('A body')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('trig-a'));
        expect(isContentHidden('A body')).toBe(true);
    });

    it('multiple mode: clicking opens both items independently', () => {
        render(
            <Accordion type="multiple" defaultValue={[]}>
                <Accordion.Item value="a">
                    <Accordion.Trigger testID="trig-a">A</Accordion.Trigger>
                    <Accordion.Content>A body</Accordion.Content>
                </Accordion.Item>
                <Accordion.Item value="b">
                    <Accordion.Trigger testID="trig-b">B</Accordion.Trigger>
                    <Accordion.Content>B body</Accordion.Content>
                </Accordion.Item>
            </Accordion>
        );
        fireEvent.click(screen.getByTestId('trig-a'));
        fireEvent.click(screen.getByTestId('trig-b'));
        expect(screen.getByText('A body')).toBeInTheDocument();
        expect(screen.getByText('B body')).toBeInTheDocument();
        // Toggle one off again — the other stays.
        fireEvent.click(screen.getByTestId('trig-a'));
        expect(isContentHidden('A body')).toBe(true);
        expect(screen.getByText('B body')).toBeInTheDocument();
    });

    it('controlled single mode fires onChange with the new value', () => {
        const onChange = jest.fn();
        const Wrapper = () => {
            const [v, setV] = useState<string | null>('a');
            return (
                <Accordion
                    type="single"
                    collapsible
                    value={v}
                    onChange={(next) => {
                        onChange(next);
                        setV(next);
                    }}
                >
                    <Accordion.Item value="a">
                        <Accordion.Trigger testID="trig-a">A</Accordion.Trigger>
                        <Accordion.Content>A body</Accordion.Content>
                    </Accordion.Item>
                    <Accordion.Item value="b">
                        <Accordion.Trigger testID="trig-b">B</Accordion.Trigger>
                        <Accordion.Content>B body</Accordion.Content>
                    </Accordion.Item>
                </Accordion>
            );
        };
        render(<Wrapper />);
        fireEvent.click(screen.getByTestId('trig-b'));
        expect(onChange).toHaveBeenCalledWith('b');
        expect(screen.getByText('B body')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('trig-b'));
        expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it('controlled multiple mode fires onChange with the new array', () => {
        const onChange = jest.fn();
        render(
            <Accordion type="multiple" value={['a']} onChange={onChange}>
                <Accordion.Item value="a">
                    <Accordion.Trigger testID="trig-a">A</Accordion.Trigger>
                    <Accordion.Content>A body</Accordion.Content>
                </Accordion.Item>
                <Accordion.Item value="b">
                    <Accordion.Trigger testID="trig-b">B</Accordion.Trigger>
                    <Accordion.Content>B body</Accordion.Content>
                </Accordion.Item>
            </Accordion>
        );
        fireEvent.click(screen.getByTestId('trig-b'));
        expect(onChange).toHaveBeenCalledWith(['a', 'b']);
    });

    it('keyboard nav: ArrowDown moves focus to the next trigger; Enter toggles', () => {
        render(
            <Accordion type="single" collapsible>
                <Accordion.Item value="a">
                    <Accordion.Trigger testID="trig-a">A</Accordion.Trigger>
                    <Accordion.Content>A body</Accordion.Content>
                </Accordion.Item>
                <Accordion.Item value="b">
                    <Accordion.Trigger testID="trig-b">B</Accordion.Trigger>
                    <Accordion.Content>B body</Accordion.Content>
                </Accordion.Item>
            </Accordion>
        );
        const a = screen.getByTestId('trig-a');
        const b = screen.getByTestId('trig-b');
        a.focus();
        fireEvent.keyDown(a, { key: 'ArrowDown' });
        expect(document.activeElement).toBe(b);
        fireEvent.keyDown(b, { key: 'Enter' });
        expect(screen.getByText('B body')).toBeInTheDocument();
    });

    it('Home / End jump focus to the first / last trigger', () => {
        render(
            <Accordion type="single" collapsible>
                <Accordion.Item value="a">
                    <Accordion.Trigger testID="trig-a">A</Accordion.Trigger>
                    <Accordion.Content>A body</Accordion.Content>
                </Accordion.Item>
                <Accordion.Item value="b">
                    <Accordion.Trigger testID="trig-b">B</Accordion.Trigger>
                    <Accordion.Content>B body</Accordion.Content>
                </Accordion.Item>
                <Accordion.Item value="c">
                    <Accordion.Trigger testID="trig-c">C</Accordion.Trigger>
                    <Accordion.Content>C body</Accordion.Content>
                </Accordion.Item>
            </Accordion>
        );
        const a = screen.getByTestId('trig-a');
        const c = screen.getByTestId('trig-c');
        a.focus();
        fireEvent.keyDown(a, { key: 'End' });
        expect(document.activeElement).toBe(c);
        fireEvent.keyDown(c, { key: 'Home' });
        expect(document.activeElement).toBe(a);
    });

    it('ARIA: triggers expose aria-expanded; content gets role="region" and aria-labelledby', () => {
        render(
            <Accordion type="single" defaultValue="a">
                <Accordion.Item value="a">
                    <Accordion.Trigger testID="trig-a">A</Accordion.Trigger>
                    <Accordion.Content testID="content-a">A body</Accordion.Content>
                </Accordion.Item>
                <Accordion.Item value="b">
                    <Accordion.Trigger testID="trig-b">B</Accordion.Trigger>
                    <Accordion.Content>B body</Accordion.Content>
                </Accordion.Item>
            </Accordion>
        );
        const trigA = screen.getByTestId('trig-a');
        const trigB = screen.getByTestId('trig-b');
        const contentA = screen.getByTestId('content-a');
        expect(trigA.getAttribute('aria-expanded')).toBe('true');
        expect(trigB.getAttribute('aria-expanded')).toBe('false');
        expect(trigA.getAttribute('aria-controls')).toBe(contentA.getAttribute('id'));
        expect(contentA.getAttribute('role')).toBe('region');
        expect(contentA.getAttribute('aria-labelledby')).toBe(trigA.getAttribute('id'));
    });

    it('disabled item ignores clicks and never opens', () => {
        render(
            <Accordion type="single" collapsible>
                <Accordion.Item value="a" disabled>
                    <Accordion.Trigger testID="trig-a">A</Accordion.Trigger>
                    <Accordion.Content>A body</Accordion.Content>
                </Accordion.Item>
                <Accordion.Item value="b">
                    <Accordion.Trigger testID="trig-b">B</Accordion.Trigger>
                    <Accordion.Content>B body</Accordion.Content>
                </Accordion.Item>
            </Accordion>
        );
        fireEvent.click(screen.getByTestId('trig-a'));
        expect(isContentHidden('A body')).toBe(true);
        // The neighbor still works.
        fireEvent.click(screen.getByTestId('trig-b'));
        expect(screen.getByText('B body')).toBeInTheDocument();
    });

    it('throws a clear error when AccordionTrigger is rendered outside an Accordion', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<Accordion.Trigger>x</Accordion.Trigger>)).toThrow(/Accordion\.Trigger/);
        } finally {
            console.error = original;
        }
    });
});
