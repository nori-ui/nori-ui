import { useState } from 'react';
import { TextArea } from '../TextArea';
import { TextInput } from '../TextInput';
import { Field } from './Field';

export default { title: 'Components/Field' };

export const Basic = () => (
    <Field>
        <Field.Label>Email</Field.Label>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
    </Field>
);

export const WithDescription = () => (
    <Field>
        <Field.Label>Email</Field.Label>
        <Field.Description>We will never share your email.</Field.Description>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
    </Field>
);

export const WithError = () => (
    <Field error="Email is required">
        <Field.Label>Email</Field.Label>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
        <Field.Error />
    </Field>
);

export const Required = () => (
    <Field required>
        <Field.Label>Email</Field.Label>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
    </Field>
);

export const Horizontal = () => (
    <Field orientation="horizontal">
        <Field.Label>Name</Field.Label>
        <Field.Control>
            <TextInput placeholder="Your name" />
        </Field.Control>
    </Field>
);

export const Validating = () => (
    <Field validating>
        <Field.Label>Username</Field.Label>
        <Field.Description>Checking availability…</Field.Description>
        <Field.Control>
            <TextInput defaultValue="claude" />
        </Field.Control>
    </Field>
);

export const TextAreaInField = () => (
    <Field>
        <Field.Label>Bio</Field.Label>
        <Field.Description>A short description of yourself.</Field.Description>
        <Field.Control>
            <TextArea placeholder="Tell us about yourself" />
        </Field.Control>
    </Field>
);

export const Controlled = () => {
    const [value, setValue] = useState('');
    return (
        <Field error={value.length === 0 ? 'Required' : null}>
            <Field.Label>Email</Field.Label>
            <Field.Control>
                <TextInput value={value} onChangeText={setValue} />
            </Field.Control>
            <Field.Error />
        </Field>
    );
};
