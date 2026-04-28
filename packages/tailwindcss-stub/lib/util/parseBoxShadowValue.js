function parseBoxShadowValue(value) {
    if (!value || typeof value !== 'string') {
        return [];
    }
    return value.split(',').map((part) => ({ value: part.trim(), inset: part.includes('inset'), color: null }));
}
module.exports = { parseBoxShadowValue };
module.exports.default = { parseBoxShadowValue };
