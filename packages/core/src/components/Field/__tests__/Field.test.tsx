import { render, screen } from '@testing-library/react';
import { NoriProvider } from '../../../provider';
import { TextInput } from '../../TextInput';
import { Field } from '../Field';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Field', () => {
    it('associates Field.Label with the control by id', () => {
        wrap(
            <Field>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
            </Field>
        );
        const labelText = screen.getByText('Email');
        const labelId = labelText.getAttribute('id');
        expect(labelId).toBeTruthy();
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-labelledby')).toBe(labelId);
    });

    it('renders Field.Description with stable id', () => {
        wrap(
            <Field>
                <Field.Label>Email</Field.Label>
                <Field.Description>We'll never share this.</Field.Description>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
            </Field>
        );
        const desc = screen.getByText("We'll never share this.");
        const id = desc.getAttribute('id');
        expect(id).toMatch(/-desc$/);
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-describedby')).toBe(id);
    });

    it('aria-describedby is undefined when no description and no error', () => {
        wrap(
            <Field>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
            </Field>
        );
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-describedby')).toBeNull();
    });

    it('sets aria-invalid when error truthy and renders Field.Error from context', () => {
        wrap(
            <Field error="Email is required">
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        const err = screen.getByText('Email is required');
        const id = err.getAttribute('id');
        expect(id).toMatch(/-error$/);
        expect(input.getAttribute('aria-describedby')).toBe(id);
    });

    it('describedby joins description and error ids when both present', () => {
        wrap(
            <Field error="Required">
                <Field.Label>Email</Field.Label>
                <Field.Description>Helper text</Field.Description>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        const input = screen.getByTestId('email-input');
        const describedBy = input.getAttribute('aria-describedby') ?? '';
        const ids = describedBy.split(' ');
        expect(ids).toHaveLength(2);
        expect(ids[0]).toMatch(/-desc$/);
        expect(ids[1]).toMatch(/-error$/);
    });

    it('Field.Error children override the context error message', () => {
        wrap(
            <Field error="Original message">
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
                <Field.Error>Overridden message</Field.Error>
            </Field>
        );
        expect(screen.getByText('Overridden message')).toBeInTheDocument();
        expect(screen.queryByText('Original message')).toBeNull();
    });

    it('Field.Error renders nothing when there is no error and no children', () => {
        wrap(
            <Field>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-invalid')).toBeNull();
    });

    it('threads aria-required when required', () => {
        wrap(
            <Field required>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
            </Field>
        );
        const input = screen.getByTestId('email-input');
        expect(input.getAttribute('aria-required')).toBe('true');
        expect(screen.getByLabelText('required')).toBeInTheDocument();
    });

    it('disabled flows from Field to control and ORs with control own disabled', () => {
        wrap(
            <Field disabled>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" editable={false} />
                </Field.Control>
            </Field>
        );
        const input = screen.getByTestId('email-input');
        expect(input).toHaveAttribute('disabled');
    });

    it('renders validating spinner without removing the error', () => {
        wrap(
            <Field validating error="Server says nope">
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <TextInput testID="email-input" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        const container = screen.getByText('Server says nope').closest('[data-validating]');
        expect(container).not.toBeNull();
    });

    it('Field.Group renders role=group and is labelled by its Field.Label', () => {
        wrap(
            <Field.Group testID="plan-group">
                <Field.Label>Plan</Field.Label>
                <Field.Description>Choose your tier</Field.Description>
            </Field.Group>
        );
        const group = screen.getByTestId('plan-group');
        expect(group.getAttribute('role')).toBe('group');
        const label = screen.getByText('Plan');
        const labelId = label.getAttribute('id');
        expect(labelId).toBeTruthy();
        expect(group.getAttribute('aria-labelledby')).toBe(labelId);
    });

    it('Field.Group propagates required/disabled/error like Field', () => {
        wrap(
            <Field.Group required error="Pick one" testID="g">
                <Field.Label>Plan</Field.Label>
                <Field.Error />
            </Field.Group>
        );
        expect(screen.getByText('Pick one')).toBeInTheDocument();
        expect(screen.getByLabelText('required')).toBeInTheDocument();
    });

    it('renders horizontal orientation', () => {
        wrap(
            <Field orientation="horizontal" testID="f">
                <Field.Label>Name</Field.Label>
                <Field.Control>
                    <TextInput testID="i" />
                </Field.Control>
            </Field>
        );
        const f = screen.getByTestId('f');
        expect(f.getAttribute('data-orientation')).toBe('horizontal');
    });

    it('renders vertical orientation by default', () => {
        wrap(
            <Field testID="f">
                <Field.Label>Name</Field.Label>
                <Field.Control>
                    <TextInput testID="i" />
                </Field.Control>
            </Field>
        );
        const f = screen.getByTestId('f');
        expect(f.getAttribute('data-orientation')).toBe('vertical');
    });
});
