import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from './TextArea';

const meta: Meta<typeof TextArea> = {
    title: 'Inputs/TextArea',
    component: TextArea,
    args: { label: 'Bio', placeholder: 'Tell us about yourself', numberOfLines: 4 },
};
export default meta;

export const Default: StoryObj<typeof TextArea> = {};
export const WithError: StoryObj<typeof TextArea> = { args: { error: 'Max 500 characters' } };
