// codegenNativeComponent shim for web builds. RN codegen is native-only;
// react-native-web has no equivalent. We return a passthrough factory so any
// module that imports codegenNativeComponent during a web build just gets a
// React component that renders nothing.
import { forwardRef } from 'react';

const Noop = forwardRef(function Noop() {
    return null;
});
Noop.displayName = 'NativeComponentNoop';
export default function codegenNativeComponent() {
    return Noop;
}
