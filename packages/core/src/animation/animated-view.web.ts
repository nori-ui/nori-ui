'use client';

// Web build: a plain RN `View`. The web side of `useAnimatedNumber`
// returns CSS transition styles directly on the style fragment, so
// no animation-aware wrapper is needed — the browser handles easing.
// Keeps reanimated out of the web bundle entirely.
import { View } from 'react-native';

export const AnimatedView = View;
