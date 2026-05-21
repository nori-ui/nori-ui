import { fireEvent, render, screen } from '@testing-library/react';
// Note: fireEvent.click is used here because the test environment is jsdom (web).
// The Item Pressable maps to a <div role="button"> in jsdom — click fires onPress.
import { View } from 'react-native';
import { Item } from '../Item';

describe('<Item>', () => {
    it('renders the title', () => {
        render(<Item title="Profile" testID="item" />);
        expect(screen.getByText('Profile')).toBeTruthy();
    });

    it('renders description when provided', () => {
        render(<Item title="Profile" description="Manage your account" />);
        expect(screen.getByText('Manage your account')).toBeTruthy();
    });

    it('does not render description when omitted', () => {
        render(<Item title="Profile" />);
        expect(screen.queryByText('Manage your account')).toBeNull();
    });

    it('fires onPress when tapped', () => {
        const spy = jest.fn();
        render(<Item title="Profile" onPress={spy} testID="item" />);
        fireEvent.click(screen.getByTestId('item'));
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does not fire onPress when disabled', () => {
        const spy = jest.fn();
        render(<Item title="Profile" onPress={spy} disabled testID="item" />);
        fireEvent.click(screen.getByTestId('item'));
        expect(spy).not.toHaveBeenCalled();
    });

    it('renders chevron when chevron=true', () => {
        render(<Item title="Profile" chevron testID="item" />);
        expect(screen.getByTestId('item-chevron')).toBeTruthy();
    });

    it('does not render chevron by default', () => {
        render(<Item title="Profile" testID="item" />);
        expect(screen.queryByTestId('item-chevron')).toBeNull();
    });

    it('renders leading slot', () => {
        render(<Item title="Profile" leading={<View testID="leading" />} />);
        expect(screen.getByTestId('leading')).toBeTruthy();
    });

    it('renders trailing slot', () => {
        render(<Item title="Profile" trailing={<View testID="trailing" />} />);
        expect(screen.getByTestId('trailing')).toBeTruthy();
    });
});
