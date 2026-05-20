import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Field } from '../Field';
import { Radio } from './Radio';

const meta: Meta<typeof Radio.Group> = {
    title: 'Controls/Radio',
    component: Radio.Group,
};
export default meta;
type Story = StoryObj<typeof Radio.Group>;

export const Shipping: Story = {
    render: () => (
        <Radio.Group defaultValue="standard" name="shipping">
            <Radio value="standard" label="Standard — 3-5 business days, free" />
            <Radio value="express" label="Express — 1-2 business days, $9" />
            <Radio value="overnight" label="Overnight — next morning, $24" />
        </Radio.Group>
    ),
};

export const InsideFieldGroup = () => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
        <Field.Group required>
            <Field.Label>Plan</Field.Label>
            <Field.Description>Pick the tier that fits your team.</Field.Description>
            <Field.Control>
                <Radio.Group {...(value !== undefined ? { value } : {})} onChange={setValue} name="plan">
                    <Radio value="hobby" label="Hobby" />
                    <Radio value="pro" label="Pro" />
                    <Radio value="enterprise" label="Enterprise" />
                </Radio.Group>
            </Field.Control>
        </Field.Group>
    );
};
