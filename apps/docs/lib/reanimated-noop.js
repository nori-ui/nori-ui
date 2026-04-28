// react-native-reanimated stub for web. Reanimated 4 imports
// RN-internal native paths (`react-native/Libraries/Renderer/shims/
// ReactFabric` etc.) at module load time, which webpack can't
// resolve. The lib's web code path never invokes any reanimated API
// (Platform.OS === 'web' branch returns early), so a stub satisfies
// the static `import` without ever executing reanimated's runtime.
//
// CRITICAL: `Animated.View` / `Animated.Text` etc. need to render
// real React elements on web, not noops — components in the lib
// wrap their visible content in `Animated.View` and a noop would
// erase the rendered output (e.g. the Switch thumb disappeared
// before this change).

import { View } from 'react-native';

const noopHook = (initial) => ({ value: initial });
const noopFactory = (factory) => (typeof factory === 'function' ? factory() : factory);
const passthrough = (target) => target;

export const useSharedValue = noopHook;
export const useAnimatedStyle = noopFactory;
export const withTiming = passthrough;
export const withSpring = passthrough;
export const Easing = {
    bezier: () => (t) => t,
    in: (fn) => fn,
    out: (fn) => fn,
    inOut: (fn) => fn,
    ease: (t) => t,
    linear: (t) => t,
};

const Animated = {
    View,
    Text: View,
    ScrollView: View,
    createAnimatedComponent: (c) => c,
};
export default Animated;
