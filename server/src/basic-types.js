const _ = require('lodash');

const BASIC_TYPES = {
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Date: "date"
};

function isValid(type) {
    return BASIC_TYPES[type] !== undefined;
}

module.exports = _.extend({}, BASIC_TYPES, {
    isValid
});
