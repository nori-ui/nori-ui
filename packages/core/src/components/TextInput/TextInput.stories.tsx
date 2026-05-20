import type { Meta, StoryObj } from '@storybook/react';
import { Field } from '../Field';
import { TextInput } from './TextInput';

const meta: Meta<typeof TextInput> = {
    title: 'Inputs/TextInput',
    component: TextInput,
    args: { placeholder: 'you@example.com' },
};
export default meta;
type Story = StoryObj<typeof TextInput>;

export const Bare: Story = {};

export const WithLeadingTrailing: Story = {
    args: {
        leading: <span>@</span>,
        trailing: <span>✕</span>,
    },
};

export const Disabled: Story = { args: { disabled: true, value: 'read only' } };

export const InsideField = () => (
    <Field>
        <Field.Label>Email</Field.Label>
        <Field.Description>We will not share this.</Field.Description>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
    </Field>
);

export const InsideFieldWithError = () => (
    <Field error="This field is required.">
        <Field.Label>Email</Field.Label>
        <Field.Control>
            <TextInput placeholder="you@example.com" />
        </Field.Control>
        <Field.Error />
    </Field>
);

export const InsideFieldDisabled = () => (
    <Field disabled>
        <Field.Label>Email</Field.Label>
        <Field.Control>
            <TextInput placeholder="you@example.com" value="user@example.com" />
        </Field.Control>
    </Field>
);
