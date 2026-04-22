// Type augmentation: NativeWind adds a `className` prop to react-native
// primitives at build time. Consumer apps that bundle NativeWind supply this
// declaration via `react-native-css-interop/types`; our library emits source
// that references it, so we augment the same surface here (bounded to what
// our components actually use).

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
        placeholderClassName?: string;
    }
}

export type {};
