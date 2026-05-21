import { useState } from 'react';
import { Button } from '../Button';
import { HStack } from '../HStack';
import { TextArea } from '../TextArea';
import { TextInput } from '../TextInput';
import { Field } from './Field';

export default { title: 'Components/Field' };

// === Shorthand (the 95% case) ===

export const Basic = () => (
    <Field label="Email">
        <TextInput placeholder="you@example.com" />
    </Field>
);

export const WithDescription = () => (
    <Field label="Email" description="We will never share your email.">
        <TextInput placeholder="you@example.com" />
    </Field>
);

export const WithError = () => (
    <Field label="Email" error="Email is required">
        <TextInput placeholder="you@example.com" />
    </Field>
);

export const Required = () => (
    <Field label="Email" required>
        <TextInput placeholder="you@example.com" />
    </Field>
);

export const Horizontal = () => (
    <Field label="Name" orientation="horizontal">
        <TextInput placeholder="Your name" />
    </Field>
);

export const Validating = () => (
    <Field label="Username" description="Checking availability…" validating>
        <TextInput defaultValue="claude" />
    </Field>
);

export const TextAreaInField = () => (
    <Field label="Bio" description="A short description of yourself.">
        <TextArea placeholder="Tell us about yourself" />
    </Field>
);

export const Controlled = () => {
    const [value, setValue] = useState('');
    return (
        <Field label="Email" error={value.length === 0 ? 'Required' : undefined}>
            <TextInput value={value} onChangeText={setValue} />
        </Field>
    );
};

// === Compound (escape hatch — custom layout) ===

export const CompoundLayout = () => (
    <Field required>
        <Field.Label>Send a note</Field.Label>
        <Field.Description>Use it to add context for the recipient.</Field.Description>
        <HStack>
            <Field.Control>
                <TextInput placeholder="Type a note" />
            </Field.Control>
            <Button>Send</Button>
        </HStack>
        <Field.Error>Note is required.</Field.Error>
    </Field>
);
