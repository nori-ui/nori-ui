// ReactFabric shim for web builds. react-native-reanimated's
// findHostInstance.js eagerly requires `react-native/Libraries/Renderer/
// shims/ReactFabric` to access `findHostInstance_DEPRECATED` for non-native
// refs. react-native-web has no equivalent — on web a "host instance"
// already _is_ the DOM node the ref points to, so we return the ref
// unchanged. Wrapping the function in a `default` mirrors RN 0.77+'s
// shape (`ReactFabric.default.findHostInstance_DEPRECATED`) so the
// reanimated lookup short-circuits without falling through to the named
// export branch.
function findHostInstance_DEPRECATED(ref) {
    return ref ?? null;
}

export default { findHostInstance_DEPRECATED };
export { findHostInstance_DEPRECATED };
