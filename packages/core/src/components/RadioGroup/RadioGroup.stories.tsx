import type { Meta, StoryObj } from '@storybook/react';
import { Radio, RadioGroup } from './RadioGroup';

const meta: Meta<typeof RadioGroup> = {
    title: 'Controls/RadioGroup',
    component: RadioGroup,
};
export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Shipping: Story = {
    render: () => (
        <RadioGroup defaultValue="standard" name="shipping">
            <Radio value="standard" label="Standard — 3-5 business days, free" />
            <Radio value="express" label="Express — 1-2 business days, $9" />
            <Radio value="overnight" label="Overnight — next morning, $24" />
        </RadioGroup>
    ),
};
