function withAlphaValue(color, _alphaValue) {
    return color;
}
function withAlphaVariable({ color, property }) {
    const toColorValue = require('./toColorValue');
    const value = toColorValue(color);
    return { [property]: value };
}
module.exports = withAlphaVariable;
module.exports.withAlphaValue = withAlphaValue;
module.exports.default = withAlphaVariable;
