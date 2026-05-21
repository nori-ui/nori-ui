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
    <Field label="Email" description="We will not share this.">
        <TextInput placeholder="you@example.com" />
    </Field>
);

export const InsideFieldWithError = () => (
    <Field label="Email" error="This field is required.">
        <TextInput placeholder="you@example.com" />
    </Field>
);

export const InsideFieldDisabled = () => (
    <Field label="Email" disabled>
        <TextInput placeholder="you@example.com" value="user@example.com" />
    </Field>
);
