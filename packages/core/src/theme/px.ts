/**
 * Strip the `px` suffix from a CSS-flavored token value and return a
 * number, the form React Native style props expect for properties like
 * `borderRadius`, `paddingHorizontal`, `fontSize`, etc.
 *
 * The tokens package emits all dimensional tokens as `${number}px`
 * strings (it's the lingua franca for both CSS and Style Dictionary
 * consumers); inside RN we need the unitless number. RN-Web tolerates
 * both, but native is strict.
 *
 * Falls through unchanged for tokens that already came in as numbers
 * (forward-compat).
 *
 * Examples:
 *   px('6px')   → 6
 *   px('1.5px') → 1.5
 *   px(6)       → 6
 *   px('foo')   → 0   (defensive — bad input shouldn't crash render)
 */
export function px(value: string | number): number {
    if (typeof value === 'number') return value;
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : 0;
}
