// codegenNativeComponent shim for web. RN codegen is native-only; return a
// React component that renders nothing so any module importing
// codegenNativeComponent during a web build doesn't crash.
import { forwardRef } from 'react';

const Noop = forwardRef(function Noop() {
    return null;
});
Noop.displayName = 'NativeComponentNoop';
export default function codegenNativeComponent() {
    return Noop;
}
