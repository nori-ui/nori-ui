import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Field } from '../Field';
import { PasswordInput } from './PasswordInput';

const meta: Meta<typeof PasswordInput> = {
    title: 'Inputs/PasswordInput',
    component: PasswordInput,
    args: { placeholder: 'Password', 'aria-label': 'Password' },
};
export default meta;
type Story = StoryObj<typeof PasswordInput>;

export const Bare: Story = {};

export const InitiallyVisible: Story = { args: { defaultVisible: true, defaultValue: 'correct horse' } };

export const Disabled: Story = { args: { disabled: true, defaultValue: 'correct horse' } };

export const InsideField = () => (
    <Field label="Password" description="At least 12 characters.">
        <PasswordInput autoComplete="new-password" />
    </Field>
);

export const InsideFieldWithError = () => (
    <Field label="Password" error="That password is too short.">
        <PasswordInput defaultValue="short" />
    </Field>
);

export const ControlledVisibility = () => {
    const [visible, setVisible] = useState(false);
    return (
        <Field label="Password" description={visible ? 'The password is visible.' : 'The password is hidden.'}>
            <PasswordInput visible={visible} onVisibleChange={setVisible} />
        </Field>
    );
};
