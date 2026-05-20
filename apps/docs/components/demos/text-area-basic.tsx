import { Field, TextArea } from '@nori-ui/core';

export default function TextAreaBasic() {
    return (
        <Field>
            <Field.Label>Bio</Field.Label>
            <Field.Control>
                <TextArea placeholder="Tell us about yourself" numberOfLines={4} />
            </Field.Control>
        </Field>
    );
}
