// tailwindcss/plugin — factory for creating custom Tailwind plugins.
// NativeWind calls this to register its own runtime plugins.
function createPlugin(handler, config) {
    return { handler: handler ?? (() => {}), config: config ?? {} };
}
createPlugin.withOptions = function withOptions(pluginFn, configFn) {
    const f = (options) => ({
        handler: typeof pluginFn === 'function' ? pluginFn(options) : () => {},
        config: typeof configFn === 'function' ? configFn(options) : {},
    });
    f.__isOptionsFunction = true;
    return f;
};
module.exports = createPlugin;
module.exports.default = createPlugin;
