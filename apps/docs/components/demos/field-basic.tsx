import { Field, TextInput } from '@nori-ui/core';

export default function FieldBasicDemo() {
    return (
        <Field label="Email">
            <TextInput placeholder="you@example.com" />
        </Field>
    );
}
