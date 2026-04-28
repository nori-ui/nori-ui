import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { TextInput } from '../TextInput';

describe('<TextInput>', () => {
    it('renders as a textbox when no label is provided', () => {
        render(<TextInput />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders the label and exposes it to the input via accessibilityLabel (cross-platform a11y)', () => {
        // The label used to be a `<label htmlFor>` element on web, which crashed
        // on native ("View config getter callback for component `label` must
        // be a function"). The label is now a cross-platform `<Text>` and the
        // a11y association lives on the input via `accessibilityLabel`.
        render(<TextInput label="Email" testID="in" />);
        expect(screen.getByText('Email')).toBeInTheDocument();
        const input = screen.getByTestId('in');
        // RN-web compiles `accessibilityLabel` to `aria-label` on the host node.
        expect(input.getAttribute('aria-label')).toBe('Email');
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
