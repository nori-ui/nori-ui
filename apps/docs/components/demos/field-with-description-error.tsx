'use client';

import { Field, TextInput } from '@nori-ui/core';
import { useState } from 'react';

export default function FieldWithDescriptionError() {
    const [value, setValue] = useState('');
    const error = value.length > 0 && value.length < 3 ? 'Username must be at least 3 characters.' : null;
    return (
        <Field error={error}>
            <Field.Label>Username</Field.Label>
            <Field.Description>3 to 20 characters. Letters, numbers, and underscores only.</Field.Description>
            <Field.Control>
                <TextInput value={value} onChangeText={setValue} placeholder="your_username" />
            </Field.Control>
            <Field.Error />
        </Field>
    );
}
