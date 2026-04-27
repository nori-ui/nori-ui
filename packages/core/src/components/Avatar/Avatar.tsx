'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import type { ImageStyle, ViewStyle } from 'react-native';
import { Image as RNImage, Text as RNText, View } from 'react-native';
import { px } from '../../theme/px';
import { useThemeColors } from '../../theme/use-theme-colors';
import { cn } from '../../utils/cn';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export type AvatarProps = {
    /** Image URL. When omitted or the load fails, the fallback renders instead. */
    src?: string;
    /**
     * Person/entity name. Used to derive initials for the fallback (first
     * letter of the first word + first letter of the last word, up to 2
     * characters). Also becomes the `alt` text on the image — set this
     * even when `src` loads cleanly.
     */
    name?: string;
    /**
     * Visual size. Maps to a fixed pixel diameter.
     * @defaultValue 'md'
     */
    size?: AvatarSize;
    /**
     * Custom fallback content shown when no `src` is provided or the image
     * fails to load. When omitted, initials derived from `name` render; if
     * `name` is also missing, a neutral placeholder shows.
     */
    fallback?: ReactNode;
    className?: string;
    testID?: string;
};

// Diameter for each size — component-density literals — not from theme
// (avatars have a tight visual ramp that doesn't tie to the spacing scale).
const SIZE_PX: Record<AvatarSize, number> = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
};

// Maps each avatar size to the closest fontSize token key. Resolved to px
// inside the component so theme overrides take effect.
const FALLBACK_FONT_KEY: Record<AvatarSize, 'xs' | 'sm' | 'lg' | 'xl'> = {
    sm: 'xs', // 12
    md: 'sm', // 14
    lg: 'lg', // 18
    xl: 'xl', // 20 (closest to legacy 22)
};

const initialsFromName = (name: string | undefined): string => {
    if (!name) return '';
    const trimmed = name.trim();
    if (!trimmed) return '';
    const parts = trimmed.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase();
};

/**
 * Circular profile picture with graceful fallback. Renders the image when
 * `src` is provided and loads cleanly; otherwise renders the supplied
 * `fallback`, derived initials from `name`, or a neutral placeholder.
 *
 * Why a single component instead of compound (`AvatarImage` + `AvatarFallback`):
 * the common case is a one-liner — `<Avatar src name />` — and the fallback
 * decision is internal state, not consumer-driven layout.
 */
export function Avatar({ src, name, size = 'md', fallback, className, testID }: AvatarProps) {
    const colors = useThemeColors();
    const [imageFailed, setImageFailed] = useState(false);
    const dim = SIZE_PX[size];
    const showImage = src !== undefined && src.length > 0 && !imageFailed;

    const containerStyle: ViewStyle = {
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: colors.semantic.background.subtle,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    };

    const imageStyle: ImageStyle = {
        width: dim,
        height: dim,
    };

    const initials = initialsFromName(name);
    const accessibilityLabel = name ?? 'Avatar';

    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            accessibilityRole="image"
            accessibilityLabel={accessibilityLabel}
            aria-label={accessibilityLabel}
            className={cn('rounded-full overflow-hidden bg-neutral-200 items-center justify-center', className)}
            style={containerStyle}
        >
            {showImage ? (
                <RNImage
                    source={{ uri: src }}
                    style={imageStyle}
                    accessibilityLabel={accessibilityLabel}
                    onError={() => setImageFailed(true)}
                />
            ) : fallback !== undefined ? (
                fallback
            ) : initials.length > 0 ? (
                <RNText
                    style={{
                        color: colors.semantic.text.muted,
                        fontFamily: colors.fontFamily.body,
                        fontSize: px(colors.fontSize[FALLBACK_FONT_KEY[size]]),
                        fontWeight: colors.fontWeight.medium as '500',
                    }}
                >
                    {initials}
                </RNText>
            ) : (
                <View
                    style={{
                        width: dim * 0.45,
                        height: dim * 0.45,
                        borderRadius: dim,
                        backgroundColor: colors.semantic.text.muted,
                    }}
                />
            )}
        </View>
    );
}
