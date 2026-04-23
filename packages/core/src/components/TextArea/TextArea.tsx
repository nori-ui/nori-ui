import type { TextInputProps } from '../TextInput';
import { TextInput } from '../TextInput';

export type TextAreaProps = TextInputProps;

/**
 * Multi-line text input. Thin wrapper over TextInput that fixes `multiline=true`
 * and provides a sensible default for `numberOfLines`.
 */
export function TextArea({ numberOfLines = 4, ...rest }: TextAreaProps) {
    return <TextInput multiline numberOfLines={numberOfLines} {...rest} />;
}
