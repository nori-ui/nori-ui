'use client';

import { Field, Radio } from '@nori-ui/core';
import { useState } from 'react';

export default function FieldGroup() {
    const [value, setValue] = useState<string | undefined>(undefined);
    const error = value === undefined ? 'Please select a plan.' : null;
    return (
        <Field.Group required error={error}>
            <Field.Label>Plan</Field.Label>
            <Field.Description>Pick the tier that fits your team.</Field.Description>
            <Field.Control>
                <Radio.Group {...(value !== undefined ? { value } : {})} onChange={setValue} name="plan">
                    <Radio value="hobby" label="Hobby" />
                    <Radio value="pro" label="Pro" />
                    <Radio value="enterprise" label="Enterprise" />
                </Radio.Group>
            </Field.Control>
            <Field.Error />
        </Field.Group>
    );
}
