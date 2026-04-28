// default-semantic-icons — minimal built-in icon placeholders for internal
// library glyphs. Consumers can swap each one via the provider:
//
//   <NoriProvider icons={{ checkmark: MyCheck, close: MyX }}>
//
// These defaults exist so the library renders usable UI out of the box even
// when lucide-react(-native) or any other icon set is not installed. They are
// NOT intended to compete with Lucide on style — override them in production.
//
// Web ships an SVG path identical to the historical lucide-style stroke. Native
// ships a Unicode glyph wrapped in `<Text>` because raw `<svg><path>` doesn't
// exist on the React Native runtime — the renderer treats lowercase host names
// as native components and crashes with "View config getter callback for
// component `path` must be a function". `react-native-svg` would solve this
// but it's an extra peer dep this library deliberately doesn't require.

import type { ComponentType } from 'react';
import { Platform, Text as RNText } from 'react-native';
import type { IconComponentProps } from './icon';

type SemanticIcon = ComponentType<IconComponentProps>;

type IconRecipe = {
    /** SVG `path` data — used on the web. */
    path: string;
    /** Unicode glyph rendered in `<Text>` on native. */
    glyph: string;
};

const isWeb = Platform.OS === 'web';

const make = ({ path, glyph }: IconRecipe): SemanticIcon =>
    function PlaceholderIcon({ size = 20, color = 'currentColor' }) {
        if (isWeb) {
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d={path} />
                </svg>
            );
        }
        return (
            <RNText
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{ fontSize: size, lineHeight: size, color: color === 'currentColor' ? undefined : color }}
            >
                {glyph}
            </RNText>
        );
    };

export type SemanticIcons = {
    checkmark: SemanticIcon;
    close: SemanticIcon;
    eye: SemanticIcon;
    eyeOff: SemanticIcon;
    chevronDown: SemanticIcon;
    chevronUp: SemanticIcon;
    alertTriangle: SemanticIcon;
    info: SemanticIcon;
    check: SemanticIcon;
    x: SemanticIcon;
};

export const defaultSemanticIcons: SemanticIcons = {
    checkmark: make({ path: 'M20 6 9 17l-5-5', glyph: '✓' }),
    close: make({ path: 'M18 6 6 18 M6 6l12 12', glyph: '✕' }),
    eye: make({
        path: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
        glyph: '👁',
    }),
    eyeOff: make({
        path: 'M17.94 17.94A10 10 0 0 1 2 12s3.5-7 10-7c2 0 3.8.6 5.4 1.5 M1 1l22 22',
        glyph: '🙈',
    }),
    chevronDown: make({ path: 'm6 9 6 6 6-6', glyph: '⌄' }),
    chevronUp: make({ path: 'm18 15-6-6-6 6', glyph: '⌃' }),
    alertTriangle: make({
        path: 'M12 9v4 M12 17h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
        glyph: '⚠',
    }),
    info: make({
        path: 'M12 8h.01 M11 12h1v4h1 M12 22C6.48 22 2 17.52 2 12 2 6.48 6.48 2 12 2c5.52 0 10 4.48 10 10 0 5.52-4.48 10-10 10z',
        glyph: 'ⓘ',
    }),
    check: make({ path: 'M20 6 9 17l-5-5', glyph: '✓' }),
    x: make({ path: 'M18 6 6 18 M6 6l12 12', glyph: '✕' }),
};
