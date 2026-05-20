import { fireEvent, render, screen } from '@testing-library/react';
import { NoriProvider } from '../../../provider';
import { Field } from '../../Field';
import { TextArea } from '../TextArea';

describe('<TextArea>', () => {
    it('renders as a multiline textbox', () => {
        render(<TextArea testID="ta" />);
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

    it('inside Field with error, receives aria-invalid from Field.Control', () => {
        render(
            <NoriProvider>
                <Field error="Too long">
                    <Field.Label>Bio</Field.Label>
                    <Field.Control>
                        <TextArea testID="ta" />
                    </Field.Control>
                    <Field.Error />
                </Field>
            </NoriProvider>
        );
        expect(screen.getByText('Too long')).toBeInTheDocument();
        expect(screen.getByTestId('ta').getAttribute('aria-invalid')).toBe('true');
    });

    it('inside Field, receives aria-labelledby from Field.Label', () => {
        render(
            <NoriProvider>
                <Field>
                    <Field.Label>Bio</Field.Label>
                    <Field.Control>
                        <TextArea testID="ta" />
                    </Field.Control>
                </Field>
            </NoriProvider>
        );
        const el = screen.getByTestId('ta');
        expect(el.getAttribute('aria-labelledby')).toBeTruthy();
    });
});
