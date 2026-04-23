// default-semantic-icons — minimal built-in SVG placeholders for internal
// library glyphs. Consumers can swap each one via the provider:
//
//   <NoriProvider icons={{ checkmark: MyCheck, close: MyX }}>
//
// These defaults exist so the library renders usable UI out of the box even when
// lucide-react(-native) is not installed. They are NOT intended to compete with
// Lucide on style — override them to match your design system.

import type { ComponentType } from 'react';
import type { IconComponentProps } from './icon';

type SemanticIcon = ComponentType<IconComponentProps>;

const make = (path: string): SemanticIcon =>
    function PlaceholderIcon({ size = 20, color = 'currentColor' }) {
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
    checkmark: make('M20 6 9 17l-5-5'),
    close: make('M18 6 6 18 M6 6l12 12'),
    eye: make('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'),
    eyeOff: make('M17.94 17.94A10 10 0 0 1 2 12s3.5-7 10-7c2 0 3.8.6 5.4 1.5 M1 1l22 22'),
    chevronDown: make('m6 9 6 6 6-6'),
    chevronUp: make('m18 15-6-6-6 6'),
    alertTriangle: make(
        'M12 9v4 M12 17h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
    ),
    info: make(
        'M12 8h.01 M11 12h1v4h1 M12 22C6.48 22 2 17.52 2 12 2 6.48 6.48 2 12 2c5.52 0 10 4.48 10 10 0 5.52-4.48 10-10 10z'
    ),
    check: make('M20 6 9 17l-5-5'),
    x: make('M18 6 6 18 M6 6l12 12'),
};
