'use client';
import { Field, Radio } from '@nori-ui/core';
import { useState } from 'react';

export default function FieldGroupDemo() {
    const [value, setValue] = useState<string | undefined>('hobby');
    return (
        <Field.Group label="Plan" description="Pick the tier that fits your team." required>
            <Radio.Group {...(value !== undefined ? { value } : {})} onChange={setValue}>
                <Radio value="hobby" label="Hobby" />
                <Radio value="pro" label="Pro" />
                <Radio value="enterprise" label="Enterprise" />
            </Radio.Group>
        </Field.Group>
    );
}
