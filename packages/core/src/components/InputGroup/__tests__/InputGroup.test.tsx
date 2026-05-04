import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { InputGroup } from '../InputGroup';

describe('<InputGroup>', () => {
    it('renders with a prefix addon only', () => {
        render(
            <InputGroup>
                <InputGroup.Addon testID="prefix">@</InputGroup.Addon>
                <InputGroup.Input testID="in" placeholder="username" />
            </InputGroup>
        );
        expect(screen.getByTestId('prefix')).toBeInTheDocument();
        expect(screen.getByTestId('in')).toBeInTheDocument();
        expect(screen.getByText('@')).toBeInTheDocument();
    });

    it('renders with a suffix addon only', () => {
        render(
            <InputGroup>
                <InputGroup.Input testID="in" placeholder="amount" />
                <InputGroup.Addon testID="suffix">USD</InputGroup.Addon>
            </InputGroup>
        );
        expect(screen.getByTestId('suffix')).toBeInTheDocument();
        expect(screen.getByTestId('in')).toBeInTheDocument();
        expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('renders with both prefix and suffix addons', () => {
        render(
            <InputGroup>
                <InputGroup.Addon testID="prefix">https://</InputGroup.Addon>
                <InputGroup.Input testID="in" defaultValue="example" />
                <InputGroup.Addon testID="suffix">.com</InputGroup.Addon>
            </InputGroup>
        );
        expect(screen.getByText('https://')).toBeInTheDocument();
        expect(screen.getByText('.com')).toBeInTheDocument();
        expect((screen.getByTestId('in') as HTMLInputElement).value).toBe('example');
    });

    it('focuses the input when an addon is clicked', () => {
        render(
            <InputGroup>
                <InputGroup.Addon testID="prefix">@</InputGroup.Addon>
                <InputGroup.Input testID="in" placeholder="username" />
            </InputGroup>
        );
        const input = screen.getByTestId('in') as HTMLInputElement;
        const addon = screen.getByTestId('prefix');
        // Walk up to the Pressable wrapper which holds the onClick handler
        const pressable = addon.closest('[role="presentation"]') ?? addon.parentElement;
        expect(pressable).not.toBeNull();
        fireEvent.click(pressable as Element);
        expect(document.activeElement).toBe(input);
    });

    it('passes label, helperText, and defaultValue through InputGroupInput', () => {
        render(
            <InputGroup>
                <InputGroup.Addon>@</InputGroup.Addon>
                <InputGroup.Input testID="in" label="Username" helperText="No spaces allowed" defaultValue="alice" />
            </InputGroup>
        );
        expect(screen.getByText('Username')).toBeInTheDocument();
        expect(screen.getByText('No spaces allowed')).toBeInTheDocument();
        expect((screen.getByTestId('in') as HTMLInputElement).value).toBe('alice');
    });

    it('label htmlFor matches the input id (a11y)', () => {
        render(
            <InputGroup>
                <InputGroup.Addon>@</InputGroup.Addon>
                <InputGroup.Input testID="in" label="Username" />
            </InputGroup>
        );
        const input = screen.getByTestId('in');
        const id = input.getAttribute('id');
        expect(id).toBeTruthy();
        const label = screen.getByText('Username');
        expect(label.getAttribute('for') ?? label.getAttribute('htmlFor')).toBe(id);
    });

    it('controlled input updates via onChangeText', () => {
        function Wrapper() {
            const [v, setV] = useState('');
            return (
                <InputGroup>
                    <InputGroup.Addon>@</InputGroup.Addon>
                    <InputGroup.Input testID="in" value={v} onChangeText={setV} />
                </InputGroup>
            );
        }
        render(<Wrapper />);
        const input = screen.getByTestId('in') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'bob' } });
        expect(input.value).toBe('bob');
    });

    it('disabled state propagates to the input', () => {
        const onChangeText = jest.fn();
        render(
            <InputGroup disabled>
                <InputGroup.Addon>@</InputGroup.Addon>
                <InputGroup.Input testID="in" onChangeText={onChangeText} />
            </InputGroup>
        );
        const input = screen.getByTestId('in') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'x' } });
        expect(onChangeText).not.toHaveBeenCalled();
    });

    it('error on InputGroupInput renders the message and sets aria-invalid', () => {
        render(
            <InputGroup>
                <InputGroup.Addon>@</InputGroup.Addon>
                <InputGroup.Input testID="in" label="Email" error="Invalid format" />
            </InputGroup>
        );
        expect(screen.getByText('Invalid format')).toBeInTheDocument();
        expect(screen.getByTestId('in').getAttribute('aria-invalid')).toBe('true');
    });

    it('group-level error prop flips aria-invalid on the input', () => {
        render(
            <InputGroup error>
                <InputGroup.Addon>@</InputGroup.Addon>
                <InputGroup.Input testID="in" />
            </InputGroup>
        );
        expect(screen.getByTestId('in').getAttribute('aria-invalid')).toBe('true');
    });
});
