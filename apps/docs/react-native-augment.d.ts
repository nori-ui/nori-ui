// Mirror the NativeWind `className` augmentation that `packages/core` relies on
// for its source. Without this, the docs typecheck — which imports
// `nori-ui` directly as workspace source — fails on primitives that
// forward className.

import 'react-native';

declare module 'react-native' {
    interface ViewProps {
        className?: string;
    }
    interface TextProps {
        className?: string;
    }
    interface PressableProps {
        className?: string;
    }
    interface ScrollViewProps {
        contentContainerClassName?: string;
    }
    interface TextInputProps {
        className?: string;
        placeholderClassName?: string;
    }
}
