function flattenColorPalette(colors) {
    const out = {};
    const walk = (obj, prefix = '') => {
        if (obj == null || typeof obj !== 'object') return;
        for (const [key, value] of Object.entries(obj)) {
            const path = prefix ? `${prefix}-${key}` : key;
            if (value && typeof value === 'object') {
                if (key === 'DEFAULT') {
                    out[prefix] = value;
                } else {
                    walk(value, path);
                }
            } else {
                out[path] = value;
            }
        }
    };
    walk(colors || {});
    return out;
}
module.exports = flattenColorPalette;
module.exports.default = flattenColorPalette;
