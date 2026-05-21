import { fireEvent, render, screen } from '@testing-library/react';
// fireEvent.click is used because the jsdom environment maps Pressable → <div role="button">.
import { Text } from 'react-native';
import { Collapsible } from '../Collapsible';

describe('<Collapsible>', () => {
    it('renders trigger and marks content as aria-hidden by default', () => {
        render(
            <Collapsible>
                <Collapsible.Trigger testID="trigger">Show</Collapsible.Trigger>
                <Collapsible.Content testID="content">
                    <Text>Hidden content</Text>
                </Collapsible.Content>
            </Collapsible>
        );
        expect(screen.getByTestId('trigger')).toBeTruthy();
        // On web, content is in the DOM but aria-hidden when closed.
        expect(screen.getByTestId('content').getAttribute('aria-hidden')).toBe('true');
    });

    it('shows content after pressing the trigger (aria-hidden flips)', () => {
        render(
            <Collapsible>
                <Collapsible.Trigger testID="trigger">Show</Collapsible.Trigger>
                <Collapsible.Content testID="content">
                    <Text>Now visible</Text>
                </Collapsible.Content>
            </Collapsible>
        );
        expect(screen.getByTestId('content').getAttribute('aria-hidden')).toBe('true');
        fireEvent.click(screen.getByTestId('trigger'));
        expect(screen.getByTestId('content').getAttribute('aria-hidden')).toBe('false');
    });

    it('renders content as visible (aria-hidden=false) when defaultOpen is set', () => {
        render(
            <Collapsible defaultOpen>
                <Collapsible.Trigger testID="trigger">Hide</Collapsible.Trigger>
                <Collapsible.Content testID="content">
                    <Text>Already open</Text>
                </Collapsible.Content>
            </Collapsible>
        );
        expect(screen.getByTestId('content').getAttribute('aria-hidden')).toBe('false');
        expect(screen.getByText('Already open')).toBeTruthy();
    });

    it('trigger has aria-expanded=false when closed', () => {
        render(
            <Collapsible>
                <Collapsible.Trigger testID="trigger">Show</Collapsible.Trigger>
                <Collapsible.Content>
                    <Text>content</Text>
                </Collapsible.Content>
            </Collapsible>
        );
        expect(screen.getByTestId('trigger').getAttribute('aria-expanded')).toBe('false');
    });

    it('calls onOpenChange when trigger is pressed', () => {
        const spy = jest.fn();
        render(
            <Collapsible onOpenChange={spy}>
                <Collapsible.Trigger testID="trigger">Show</Collapsible.Trigger>
                <Collapsible.Content>
                    <Text>x</Text>
                </Collapsible.Content>
            </Collapsible>
        );
        fireEvent.click(screen.getByTestId('trigger'));
        expect(spy).toHaveBeenCalledWith(true);
    });
});
