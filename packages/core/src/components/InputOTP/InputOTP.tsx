'use client';

import { type ClipboardEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
    type NativeSyntheticEvent,
    Platform,
    TextInput as RNTextInput,
    StyleSheet,
    type TextInputKeyPressEventData,
    View,
} from 'react-native';
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
    /** Form field name forwarded to hidden input (web). */
    name?: string;
    /** aria-label override. @defaultValue 'One-time code' */
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
    'aria-label': ariaLabel = 'One-time code',
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    className,
    testID,
}: InputOTPProps) => {
    const colors = useThemeColors();

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

    // -------------------------------------------------------------------------
    // Web: handle paste on the container div
    // -------------------------------------------------------------------------
    const onContainerPaste = useCallback(
        (e: ClipboardEvent<HTMLDivElement>) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain') ?? '';
            const filtered = filterValue(text, pattern, length);
            const next = Array.from({ length }, (_, i) => filtered[i] ?? '');
            updateCells(next);
            // Focus the next empty cell or the last
            const nextEmpty = next.indexOf('');
            focusCell(nextEmpty === -1 ? length - 1 : nextEmpty);
        },
        [pattern, length, updateCells, focusCell]
    );

    // -------------------------------------------------------------------------
    // Native: detect paste by checking if onChangeText receives >1 char
    // -------------------------------------------------------------------------
    const handleChangeText = useCallback(
        (text: string, idx: number) => {
            // Native paste might deliver all chars at once
            if (text.length > 1) {
                const filtered = filterValue(text, pattern, length);
                const next = Array.from({ length }, (_, i) => filtered[i] ?? '');
                updateCells(next);
                const nextEmpty = next.indexOf('');
                focusCell(nextEmpty === -1 ? length - 1 : nextEmpty);
                return;
            }
            const char = text.slice(-1); // last char in case of replacement
            if (char && !isAllowed(char, pattern)) {
                return;
            }
            const next = [...cells];
            next[idx] = char;
            updateCells(next);
            if (char) {
                focusCell(idx + 1);
            }
        },
        [cells, pattern, length, updateCells, focusCell]
    );

    // -------------------------------------------------------------------------
    // Web: onKeyDown per cell (for backspace + web-only arrow navigation)
    // -------------------------------------------------------------------------
    const handleWebKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
            if (e.key === 'Backspace') {
                if (cells[idx] !== '') {
                    const next = [...cells];
                    next[idx] = '';
                    updateCells(next);
                } else {
                    focusCell(idx - 1);
                }
                e.preventDefault();
            } else if (e.key === 'ArrowLeft') {
                focusCell(idx - 1);
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                focusCell(idx + 1);
                e.preventDefault();
            } else if (e.key.length === 1 && isAllowed(e.key, pattern)) {
                // Let onChangeText handle it, but clear the cell first so
                // single-char inputs don't accumulate
                const next = [...cells];
                next[idx] = e.key;
                updateCells(next);
                focusCell(idx + 1);
                e.preventDefault();
            }
        },
        [cells, pattern, focusCell, updateCells]
    );

    // -------------------------------------------------------------------------
    // Native: onKeyPress for backspace
    // -------------------------------------------------------------------------
    const handleNativeKeyPress = useCallback(
        (e: NativeSyntheticEvent<TextInputKeyPressEventData>, idx: number) => {
            if (e.nativeEvent.key === 'Backspace') {
                if (cells[idx] !== '') {
                    const next = [...cells];
                    next[idx] = '';
                    updateCells(next);
                } else {
                    focusCell(idx - 1);
                }
            }
        },
        [cells, focusCell, updateCells]
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

    const isWeb = Platform.OS === 'web';

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
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
            {...(isWeb ? {} : { accessible: true, accessibilityLabel: ariaLabel })}
            {...(containerProps as object)}
            className={cn('flex-row items-center gap-2', className)}
            style={styles.container}
        >
            {Array.from({ length }, (_, idx) => {
                const cellValue = cells[idx] ?? '';
                const isFocused = false; // managed by native focus system

                const cellRef = (el: RNTextInput | null) => {
                    inputRefs.current[idx] = el;
                };

                // Web cell uses a standard HTML input via RN TextInput
                const webProps = isWeb
                    ? {
                          onKeyDown: (e: unknown) => handleWebKeyDown(e as KeyboardEvent<HTMLInputElement>, idx),
                          // id only on the first cell
                          ...(idx === 0 && id ? { id, nativeID: id } : {}),
                          ...(idx === 0 && name ? { name } : {}),
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
                          onKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) =>
                              handleNativeKeyPress(e, idx),
                      };

                return (
                    <RNTextInput
                        // biome-ignore lint/suspicious/noArrayIndexKey: OTP cell index IS its stable slot identity
                        key={idx}
                        ref={cellRef}
                        value={cellValue}
                        placeholder={isFocused ? '' : placeholder}
                        maxLength={1}
                        editable={!disabled}
                        autoFocus={autoFocus && idx === 0}
                        testID={testID ? `${testID}-cell-${idx}` : undefined}
                        onChangeText={(text) => handleChangeText(text, idx)}
                        accessibilityLabel={`Digit ${idx + 1} of ${length}`}
                        {...nativeOnlyProps}
                        {...(webProps as object)}
                        style={cellStyle}
                    />
                );
            })}

            {/* Hidden input for form submission on web */}
            {isWeb && name ? (
                <RNTextInput
                    style={styles.hidden}
                    value={cells.join('')}
                    aria-hidden
                    tabIndex={-1}
                    {...({ name } as object)}
                />
            ) : null}
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
    hidden: {
        position: 'absolute',
        width: 0,
        height: 0,
        opacity: 0,
    },
});
