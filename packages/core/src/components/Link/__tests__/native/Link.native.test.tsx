import { fireEvent, render } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { Link } from '../../Link';

describe('Link (native)', () => {
    let openURL: jest.SpyInstance;

    beforeEach(() => {
        openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    });

    afterEach(() => {
        openURL.mockRestore();
    });

    it('is exposed as a link', () => {
        const { getByRole } = render(<Link href="https://example.com">Example</Link>);
        expect(getByRole('link', { name: 'Example' })).toBeTruthy();
    });

    it('opens the href with Linking.openURL when pressed', () => {
        const { getByRole } = render(<Link href="https://example.com">Example</Link>);
        fireEvent.press(getByRole('link'));
        expect(openURL).toHaveBeenCalledWith('https://example.com');
    });

    it('calls onPress instead of opening the URL when onPress is given', () => {
        const onPress = jest.fn();
        const { getByRole } = render(
            <Link href="https://example.com" onPress={onPress}>
                Example
            </Link>
        );
        fireEvent.press(getByRole('link'));
        expect(onPress).toHaveBeenCalledTimes(1);
        expect(openURL).not.toHaveBeenCalled();
    });

    it('does nothing when disabled and reports the disabled state', () => {
        const onPress = jest.fn();
        const { getByRole } = render(
            <Link href="https://example.com" onPress={onPress} disabled>
                Example
            </Link>
        );
        const link = getByRole('link');
        fireEvent.press(link);
        expect(onPress).not.toHaveBeenCalled();
        expect(openURL).not.toHaveBeenCalled();
        expect(link).toBeDisabled();
    });

    it('external adds no "new tab" text on native', () => {
        const { getByRole, queryByText } = render(
            <Link href="https://example.com" external>
                Example
            </Link>
        );
        expect(getByRole('link', { name: 'Example' })).toBeTruthy();
        expect(queryByText(/new tab/)).toBeNull();
    });
});
