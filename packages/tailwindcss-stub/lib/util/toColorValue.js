function toColorValue(maybeFn) {
    if (typeof maybeFn === 'function') {
        return maybeFn({ opacityVariable: undefined, opacityValue: 1 });
    }
    return maybeFn;
}
module.exports = toColorValue;
module.exports.default = toColorValue;
