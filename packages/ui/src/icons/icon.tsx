import type { ComponentType } from 'react';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export type IconComponentProps = {
    size?: number;
    color?: string;
};

export type IconProps = {
    as: ComponentType<IconComponentProps>;
    size?: IconSize;
    color?: string;
};

const SIZE_MAP: Record<Exclude<IconSize, number>, number> = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
};

/**
 * Thin wrapper around an icon component. Consumer imports the icon they want
 * from any library (e.g. lucide-react-native) and passes it as `as`. No registry,
 * no runtime lookup — tree-shaking is automatic.
 *
 * RSC-safe: pure render, no hooks, no refs.
 */
export function Icon({ as: IconComponent, size = 'md', color }: IconProps) {
    const numericSize = typeof size === 'number' ? size : SIZE_MAP[size];
    // Only spread color when defined — avoids passing `color: undefined` under
    // exactOptionalPropertyTypes.
    const colorProps = color === undefined ? {} : { color };
    return <IconComponent size={numericSize} {...colorProps} />;
}
