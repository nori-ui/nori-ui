'use client';

import { type ClipboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, TextInput as RNTextInput, StyleSheet, View } from 'react-native';
import { useTranslation } from '../../i18n/use-translation';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InputOTPPattern = 'numeric' | 'alphanumeric';

export type InputOTPProps = {
    /** Current value (string of digits/chars, length ≤ `length`). */
    value?: string;
    /** Called with the full value string on any change. */
    onChange?: (value: string) => void;
    /** Called once the code reaches `length` characters. */
    onComplete?: (value: string) => void;
    /** Number of OTP cells. @defaultValue 6 */
    length?: number;
    /** Placeholder shown in empty cells. @defaultValue '·' */
    placeholder?: string;
    /** Input character set validation. @defaultValue 'numeric' */
    pattern?: InputOTPPattern;
    /** Whether the input is disabled. */
    disabled?: boolean;
    /** Auto-focus the first cell on mount. */
    autoFocus?: boolean;
    /** a11y / form id forwarded to the first cell. */
    id?: string;
    /** Form field name — rendered as a hidden input carrying the full code (web). */
    name?: string;
    /** aria-label override. @defaultValue the `inputOtp.label` translation ('One-time code') */
    'aria-label'?: string;
    /** aria-labelledby for Field.Control wiring. */
    'aria-labelledby'?: string;
    /** aria-describedby for Field.Control wiring. */
    'aria-describedby'?: string;
    /** aria-invalid for Field.Control wiring. */
    'aria-invalid'?: boolean | 'true' | 'false';
    className?: string;
    testID?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAllowed(char: string, pattern: InputOTPPattern): boolean {
    if (pattern === 'numeric') {
        return /^\d$/.test(char);
    }
    return /^[a-zA-Z0-9]$/.test(char);
}

function filterValue(value: string, pattern: InputOTPPattern, length: number): string {
    return value
        .split('')
        .filter((c) => isAllowed(c, pattern))
        .slice(0, length)
        .join('');
}

/**
 * The subset of a key event both platforms deliver: react-native-web passes
 * the DOM keyboard event (modifiers included), native only `nativeEvent.key`.
 */
type CellKeyEvent = {
    type?: string;
    nativeEvent: { key: string; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean };
    preventDefault?: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Segmented one-time-code input with auto-advance, backspace backtrack,
 * and paste-to-fill. Works cross-platform (web + native) via RN TextInput refs.
 *
 * Field.Control-compatible: pass `id`, `aria-labelledby`, `aria-describedby`,
 * `aria-invalid`, and `disabled` down from Field.Control to wire a11y.
 *
 * ```tsx
 * <InputOTP value={code} onChange={setCode} onComplete={submit} length={6} />
 * ```
 */
export const InputOTP = ({
    value = '',
    onChange,
    onComplete,
    length = 6,
    placeholder = '·',
    pattern = 'numeric',
    disabled = false,
    autoFocus = false,
    id,
    name,
    'aria-label': ariaLabelProp,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    className,
    testID,
}: InputOTPProps) => {
    const colors = useThemeColors();
    const { t } = useTranslation();
    const ariaLabel = ariaLabelProp ?? t('inputOtp.label');
    const isWeb = Platform.OS === 'web';

    // Internal representation as array of single chars
    const [cells, setCells] = useState<string[]>(() => {
        const filtered = filterValue(value, pattern, length);
        return Array.from({ length }, (_, i) => filtered[i] ?? '');
    });

    // Sync controlled value into cells
    const prevValue = useRef(value);
    useEffect(() => {
        if (value !== prevValue.current) {
            prevValue.current = value;
            const filtered = filterValue(value, pattern, length);
            setCells(Array.from({ length }, (_, i) => filtered[i] ?? ''));
        }
    }, [value, pattern, length]);

    const inputRefs = useRef<Array<RNTextInput | null>>([]);

    const focusCell = useCallback(
        (idx: number) => {
            if (idx >= 0 && idx < length) {
                inputRefs.current[idx]?.focus();
            }
        },
        [length]
    );

    const updateCells = useCallback(
        (next: string[]) => {
            setCells(next);
            const joined = next.join('');
            onChange?.(joined);
            if (joined.length === length && !next.includes('')) {
                onComplete?.(joined);
            }
        },
        [onChange, onComplete, length]
    );

    /** Replace the whole code with pasted / autofilled text, then focus the next empty cell. */
    const fillFromText = useCallback(
        (text: string) => {
            const filtered = filterValue(text, pattern, length);
            const next = Array.from({ length }, (_, i) => filtered[i] ?? '');
            updateCells(next);
            const nextEmpty = next.indexOf('');
            focusCell(nextEmpty === -1 ? length - 1 : nextEmpty);
        },
        [pattern, length, updateCells, focusCell]
    );

    // react-native-web's View does not forward `onPaste`, so there a paste
    // arrives through `onChangeText` as multi-character text instead. This
    // handler covers hosts that do forward clipboard events.
    const onContainerPaste = useCallback(
        (e: ClipboardEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (disabled) {
                return;
            }
            fillFromText(e.clipboardData.getData('text/plain') ?? '');
        },
        [disabled, fillFromText]
    );

    const handleChangeText = useCallback(
        (text: string, idx: number) => {
            if (disabled) {
                return;
            }
            const previous = cells[idx] ?? '';
            if (text === previous) {
                // Retyping the character a cell already holds still advances.
                if (text !== '') {
                    focusCell(idx + 1);
                }
                return;
            }
            let incoming = text;
            // Typing into a filled cell whose text was not selected yields
            // "old + new" (or "new + old"); keep only the new character.
            if (previous !== '' && text.length === 2 && text.includes(previous)) {
                incoming = text.replace(previous, '') || previous;
            }
            // A paste into a filled cell arrives as "old + pasted"; drop the
            // old character so the pasted code is not shifted by one.
            if (previous !== '' && incoming.length > 2 && incoming.startsWith(previous)) {
                incoming = incoming.slice(previous.length);
            }
            if (incoming.length > 1) {
                fillFromText(incoming);
                return;
            }
            if (incoming && !isAllowed(incoming, pattern)) {
                return;
            }
            const next = [...cells];
            next[idx] = incoming;
            updateCells(next);
            if (incoming) {
                focusCell(idx + 1);
            }
        },
        [cells, disabled, pattern, updateCells, focusCell, fillFromText]
    );

    const handleKey = useCallback(
        (e: CellKeyEvent, idx: number) => {
            // A DOM `keypress` only repeats the `keydown` already handled.
            if (disabled || e.type === 'keypress') {
                return;
            }
            const { key, metaKey, ctrlKey, altKey } = e.nativeEvent;
            if (key === 'Backspace') {
                if (cells[idx] === '') {
                    focusCell(idx - 1);
                    e.preventDefault?.();
                    return;
                }
                // Native reports the deletion through `onChangeText('')` as
                // well; clearing here too would fire `onChange` twice.
                if (isWeb) {
                    const next = [...cells];
                    next[idx] = '';
                    updateCells(next);
                    e.preventDefault?.();
                }
                return;
            }
            if (!isWeb) {
                return;
            }
            if (key === 'ArrowLeft') {
                focusCell(idx - 1);
                e.preventDefault?.();
            } else if (key === 'ArrowRight') {
                focusCell(idx + 1);
                e.preventDefault?.();
            } else if (key.length === 1 && !metaKey && !ctrlKey && !altKey && isAllowed(key, pattern)) {
                // Write the key directly so a filled cell is overtyped
                // instead of accumulating a second character.
                const next = [...cells];
                next[idx] = key;
                updateCells(next);
                focusCell(idx + 1);
                e.preventDefault?.();
            }
        },
        [cells, disabled, isWeb, pattern, focusCell, updateCells]
    );

    // -------------------------------------------------------------------------
    // Styles
    // -------------------------------------------------------------------------
    const cellStyle = [
        styles.cell,
        {
            width: px(48),
            height: px(56),
            borderRadius: px(colors.radius.md),
            borderColor: colors.semantic.border.default,
            backgroundColor: colors.semantic.background.elevated,
            color: colors.semantic.text.default,
            fontSize: px(colors.fontSize.xl),
            fontFamily: colors.fontFamily.body,
        },
        disabled ? styles.disabled : null,
        ariaInvalid === true || ariaInvalid === 'true' ? { borderColor: colors.color.danger } : null,
    ];

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    // Native gets no container label: marking the container `accessible`
    // would merge all cells into one screen-reader element, so each cell
    // carries the group label itself.
    const containerProps = isWeb
        ? {
              onPaste: onContainerPaste,
              role: 'group' as const,
              'aria-label': ariaLabel,
              'aria-labelledby': ariaLabelledBy,
              'aria-describedby': ariaDescribedBy,
          }
        : {};

    return (
        <View
            testID={testID}
            {...(containerProps as object)}
            className={cn('flex-row items-center gap-2', className)}
            style={styles.container}
        >
            {Array.from({ length }, (_, idx) => {
                const cellValue = cells[idx] ?? '';
                const cellLabel = t('inputOtp.cellLabel', { index: idx + 1, total: length });

                const cellRef = (el: RNTextInput | null) => {
                    inputRefs.current[idx] = el;
                };

                const onKey = (e: CellKeyEvent) => handleKey(e, idx);

                const webProps = isWeb
                    ? {
                          // react-native-web's TextInput replaces `onKeyDown`
                          // with its own handler that calls `onKeyPress`;
                          // hosts that forward props verbatim use `onKeyDown`.
                          onKeyDown: onKey,
                          // id only on the first cell
                          ...(idx === 0 && id ? { id, nativeID: id } : {}),
                          ...(idx === 0 && ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
                          ...(idx === 0 && ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
                          ...(idx === 0 && ariaInvalid !== undefined ? { 'aria-invalid': ariaInvalid } : {}),
                          inputMode: pattern === 'numeric' ? ('numeric' as const) : ('text' as const),
                      }
                    : {};

                // On web, omit native-only props that don't map to DOM attributes
                const nativeOnlyProps = isWeb
                    ? {}
                    : {
                          keyboardType: pattern === 'numeric' ? ('number-pad' as const) : ('default' as const),
                          textAlign: 'center' as const,
                          selectTextOnFocus: true,
                          textContentType: 'oneTimeCode' as const,
                      };

                return (
                    <RNTextInput
                        // biome-ignore lint/suspicious/noArrayIndexKey: OTP cell index IS its stable slot identity
                        key={idx}
                        ref={cellRef}
                        value={cellValue}
                        placeholder={placeholder}
                        // Room for a whole pasted / autofilled code: a limit
                        // of 1 truncates it before `onChangeText` sees it.
                        maxLength={Math.max(length, 2)}
                        editable={!disabled}
                        autoFocus={autoFocus && idx === 0}
                        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                        testID={testID ? `${testID}-cell-${idx}` : undefined}
                        onChangeText={(text) => handleChangeText(text, idx)}
                        onKeyPress={onKey}
                        accessibilityLabel={isWeb ? cellLabel : `${ariaLabel}, ${cellLabel}`}
                        {...nativeOnlyProps}
                        {...(webProps as object)}
                        style={cellStyle}
                    />
                );
            })}

            {/* react-native-web drops `name` from its primitives, so form submission needs a real input. */}
            {isWeb && name ? <input type="hidden" name={name} value={cells.join('')} disabled={disabled} /> : null}
        </View>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cell: {
        borderWidth: 1,
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.6,
    },
});
