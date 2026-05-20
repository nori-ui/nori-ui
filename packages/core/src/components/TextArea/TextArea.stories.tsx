import type { Meta, StoryObj } from '@storybook/react';
import { Field } from '../Field';
import { TextArea } from './TextArea';

const meta: Meta<typeof TextArea> = {
    title: 'Inputs/TextArea',
    component: TextArea,
    args: { placeholder: 'Tell us about yourself', numberOfLines: 4 },
};
export default meta;

export const Bare: StoryObj<typeof TextArea> = {};

export const Disabled: StoryObj<typeof TextArea> = { args: { disabled: true, value: 'Cannot edit this.' } };

export const InsideField = () => (
    <Field>
        <Field.Label>Bio</Field.Label>
        <Field.Description>Tell us a bit about yourself.</Field.Description>
        <Field.Control>
            <TextArea placeholder="Tell us about yourself" numberOfLines={4} />
        </Field.Control>
    </Field>
);

export const InsideFieldWithError = () => (
    <Field error="Max 500 characters exceeded.">
        <Field.Label>Bio</Field.Label>
        <Field.Control>
            <TextArea placeholder="Tell us about yourself" numberOfLines={4} />
        </Field.Control>
        <Field.Error />
    </Field>
);
