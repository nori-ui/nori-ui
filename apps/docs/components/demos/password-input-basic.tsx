import { Field, PasswordInput } from '@nori-ui/core';

export default function PasswordInputBasic() {
    return (
        <Field label="Password" description="At least 12 characters.">
            <PasswordInput autoComplete="new-password" />
        </Field>
    );
}
