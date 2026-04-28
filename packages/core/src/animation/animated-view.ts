'use client';

// Native build: reanimated's `Animated.View` consumes the worklet
// styles produced by `useAnimatedStyle`. A regular `View` would
// render the shared values' default frame and never animate.
import Animated from 'react-native-reanimated';

export const AnimatedView = Animated.View;
