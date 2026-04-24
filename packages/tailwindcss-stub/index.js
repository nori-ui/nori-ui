// @nori-ui/tailwindcss-stub — exports the surface NativeWind v4 reads at runtime.
// Real tailwindcss uses Node crypto internally; Snackager's webpack rejects that,
// so we expose the same module shape with crypto-free no-ops.
module.exports = {
    default: {},
    // tailwindcss's main export is a PostCSS plugin factory. NativeWind doesn't
    // invoke it at runtime, but returning a no-op keeps the shape compatible.
    plugin: (handler) => ({ handler: handler ?? (() => {}), config: {} }),
};
