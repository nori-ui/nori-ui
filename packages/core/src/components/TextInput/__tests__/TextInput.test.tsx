import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { NoriProvider } from '../../../provider';
import { Field } from '../../Field';
import { TextInput } from '../TextInput';

describe('<TextInput>', () => {
    it('renders as a textbox', () => {
        render(<TextInput />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('uncontrolled: calls onChangeText on input', () => {
        const onChangeText = jest.fn();
        render(<TextInput onChangeText={onChangeText} testID="in" />);
        fireEvent.change(screen.getByTestId('in'), { target: { value: 'hello' } });
        expect(onChangeText).toHaveBeenCalledWith('hello');
    });

    it('controlled: reflects value and updates via onChangeText', () => {
        function Wrapper() {
            const [v, setV] = useState('');
            return <TextInput testID="in" value={v} onChangeText={setV} />;
        }
        render(<Wrapper />);
        const input = screen.getByTestId('in');
        fireEvent.change(input, { target: { value: 'a' } });
        expect((input as HTMLInputElement).value).toBe('a');
    });

    it('respects disabled state', () => {
        const onChangeText = jest.fn();
        render(<TextInput disabled onChangeText={onChangeText} testID="in" />);
        fireEvent.change(screen.getByTestId('in'), { target: { value: 'x' } });
        expect(onChangeText).not.toHaveBeenCalled();
    });

    it('renders leading and trailing content', () => {
        render(
            <TextInput leading={<span data-testid="lead">search</span>} trailing={<span data-testid="trail">x</span>} />
        );
        expect(screen.getByTestId('lead')).toBeInTheDocument();
        expect(screen.getByTestId('trail')).toBeInTheDocument();
    });

    it('inside Field, receives aria-labelledby from Field.Label', () => {
        render(
            <NoriProvider>
                <Field>
                    <Field.Label>Email</Field.Label>
                    <Field.Control>
                        <TextInput testID="t" />
                    </Field.Control>
                </Field>
            </NoriProvider>
        );
        const input = screen.getByTestId('t');
        expect(input.getAttribute('aria-labelledby')).toBeTruthy();
    });

    it('inside Field with error, receives aria-invalid from Field.Control', () => {
        render(
            <NoriProvider>
                <Field error="Required">
                    <Field.Label>Email</Field.Label>
                    <Field.Control>
                        <TextInput testID="t" />
                    </Field.Control>
                    <Field.Error />
                </Field>
            </NoriProvider>
        );
        const input = screen.getByTestId('t');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('inside Field with description, receives aria-describedby from Field.Control', () => {
        render(
            <NoriProvider>
                <Field>
                    <Field.Label>Email</Field.Label>
                    <Field.Description>We will not share this.</Field.Description>
                    <Field.Control>
                        <TextInput testID="t" />
                    </Field.Control>
                </Field>
            </NoriProvider>
        );
        const input = screen.getByTestId('t');
        expect(input.getAttribute('aria-describedby')).toBeTruthy();
    });
});
