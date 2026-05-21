'use client';

import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { cn } from '../../utils/cn';

export type AspectRatioProps = {
    /**
     * The ratio expressed as width / height. Common values:
     * - `16 / 9` (1.777…) — widescreen video
     * - `4 / 3` (1.333…) — classic photo
     * - `1` — square
     * - `2 / 3` (0.666…) — portrait
     */
    ratio: number;
    children?: ReactNode;
    className?: string;
    testID?: string;
};

const BASE_STYLE: ViewStyle = {
    overflow: 'hidden',
};

/**
 * Wraps children in a container that maintains a fixed width-to-height ratio.
 * Works identically on web and native — React Native's `aspectRatio` style
 * property maps to the CSS `aspect-ratio` property via react-native-web.
 *
 * ```tsx
 * <AspectRatio ratio={16 / 9}>
 *   <Image source={src} style={{ width: '100%', height: '100%' }} />
 * </AspectRatio>
 * ```
 */
export const AspectRatio = ({ ratio, children, className, testID }: AspectRatioProps) => {
    const containerStyle: ViewStyle = {
        ...BASE_STYLE,
        aspectRatio: ratio,
    };

    return (
        <View
            {...(testID !== undefined ? { testID } : {})}
            className={cn('overflow-hidden', className)}
            style={containerStyle}
        >
            {children}
        </View>
    );
};
