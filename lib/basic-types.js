const _ = require('lodash');

const BASIC_TYPES = {
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Date: "date"
};

const INVERSED = _.reduce(BASIC_TYPES, (memo, value, key) => {
    return _.extend(memo, {[value]: true});
}, {});

function isValid(type) {
    return INVERSED[type] !== undefined;
}

module.exports = _.extend({}, BASIC_TYPES, {
    isValid
});
