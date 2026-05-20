import { Field, TextInput } from '@nori-ui/core';

export default function FieldBasic() {
    return (
        <Field>
            <Field.Label>Email</Field.Label>
            <Field.Control>
                <TextInput placeholder="you@example.com" />
            </Field.Control>
        </Field>
    );
}
