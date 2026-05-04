import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from './RadioGroup';

const meta: Meta<typeof Radio.Group> = {
    title: 'Controls/RadioGroup',
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
