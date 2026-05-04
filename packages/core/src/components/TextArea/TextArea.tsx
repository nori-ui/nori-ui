import type { TextStyle } from 'react-native';
import type { TextInputProps } from '../TextInput';
import { TextInput } from '../TextInput';

export type TextAreaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export type TextAreaProps = TextInputProps & {
    /**
     * On web, controls the underlying `<textarea>`'s resize handle. Ignored
     * on native (where height is determined by `numberOfLines`).
     * @defaultValue 'vertical'
     */
    resize?: TextAreaResize;
};

/**
 * Multi-line text input. Thin wrapper over TextInput that fixes `multiline=true`
 * and provides a sensible default for `numberOfLines`.
 *
 * The web textarea is vertically resizable by default — set `resize="none"`
 * to lock it. On native, the prop is a no-op since RN's `<TextInput multiline>`
 * sizes from `numberOfLines`.
 */
export const TextArea = ({ numberOfLines = 4, resize = 'vertical', style, ...rest }: TextAreaProps) => {
    // `resize` isn't part of RN's TextStyle but react-native-web passes
    // unknown style props through to the DOM <textarea>, so this lands
    // on the right element on web and is silently ignored on native.
    const resizeStyle = { resize } as unknown as TextStyle;
    const merged = style === undefined ? resizeStyle : [resizeStyle, style];
    return <TextInput multiline numberOfLines={numberOfLines} {...rest} style={merged} />;
};
