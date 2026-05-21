'use client';
import { Field, TextInput } from '@nori-ui/core';
import { useState } from 'react';

export default function FieldWithDescriptionError() {
    const [value, setValue] = useState('');
    const error = value.trim().length === 0 ? 'Email is required.' : undefined;
    return (
        <Field label="Email" description="We will never share your email." error={error} required>
            <TextInput value={value} onChangeText={setValue} placeholder="you@example.com" />
        </Field>
    );
}
