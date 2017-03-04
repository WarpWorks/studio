const Base = require('./base');

class Literal extends Base {
    constructor(enumeration, id, name, desc) {
        super("Literal", enumeration, id, name, desc);
        this.position = null;
        this.icon = null;
    }

    // eslint-disable-next-line camelcase
    getParent_Enumeration() {
        return this.parent;
    }

    toString() {
        return this.name;
    }

    toJSON() {
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            id: this.idToJSON()
        };
    }
}

module.exports = Literal;
