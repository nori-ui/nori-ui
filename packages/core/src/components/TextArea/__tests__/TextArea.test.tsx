import { fireEvent, render, screen } from '@testing-library/react';
import { TextArea } from '../TextArea';

describe('<TextArea>', () => {
    it('renders as a multiline textbox', () => {
        render(<TextArea testID="ta" label="Bio" />);
        const el = screen.getByTestId('ta');
        // RN-Web renders multiline RNTextInput as a <textarea>
        expect(el.tagName.toLowerCase()).toBe('textarea');
    });

    it('sets rows via numberOfLines (maps to textarea rows on web)', () => {
        render(<TextArea testID="ta" numberOfLines={6} />);
        const el = screen.getByTestId('ta');
        expect(el.getAttribute('rows')).toBe('6');
    });

    it('propagates onChangeText', () => {
        const onChangeText = jest.fn();
        render(<TextArea onChangeText={onChangeText} testID="ta" />);
        fireEvent.change(screen.getByTestId('ta'), { target: { value: 'multiline\nvalue' } });
        expect(onChangeText).toHaveBeenCalledWith('multiline\nvalue');
    });

    it('shows error state', () => {
        render(<TextArea testID="ta" label="Bio" error="Too long" />);
        expect(screen.getByText('Too long')).toBeInTheDocument();
        expect(screen.getByTestId('ta').getAttribute('aria-invalid')).toBe('true');
    });
});
