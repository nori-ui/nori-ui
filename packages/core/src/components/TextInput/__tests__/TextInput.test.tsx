import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { TextInput } from '../TextInput';

describe('<TextInput>', () => {
    it('renders as a textbox when no label is provided', () => {
        render(<TextInput />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('associates the label with the input via htmlFor/id (a11y)', () => {
        render(<TextInput label="Email" testID="in" />);
        const input = screen.getByTestId('in');
        const id = input.getAttribute('id');
        expect(id).toBeTruthy();
        // label is a <label> element with htmlFor === id on web
        const label = screen.getByText('Email');
        expect(label.getAttribute('for') ?? label.getAttribute('htmlFor')).toBe(id);
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

    it('shows helper text when provided', () => {
        render(<TextInput label="Email" helperText="We'll never share it" />);
        expect(screen.getByText("We'll never share it")).toBeInTheDocument();
    });

    it('shows error message and sets aria-invalid when error prop is set', () => {
        render(<TextInput label="Email" error="Required" testID="in" />);
        expect(screen.getByText('Required')).toBeInTheDocument();
        expect(screen.getByTestId('in').getAttribute('aria-invalid')).toBe('true');
    });

    it('error takes precedence over helperText', () => {
        render(<TextInput label="Email" helperText="Helper" error="Error" />);
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });

    it('respects disabled state', () => {
        const onChangeText = jest.fn();
        render(<TextInput disabled onChangeText={onChangeText} testID="in" />);
        fireEvent.change(screen.getByTestId('in'), { target: { value: 'x' } });
        expect(onChangeText).not.toHaveBeenCalled();
    });

    it('renders leading and trailing content', () => {
        render(
            <TextInput
                label="Search"
                leading={<span data-testid="lead">🔍</span>}
                trailing={<span data-testid="trail">x</span>}
            />
        );
        expect(screen.getByTestId('lead')).toBeInTheDocument();
        expect(screen.getByTestId('trail')).toBeInTheDocument();
    });
});
