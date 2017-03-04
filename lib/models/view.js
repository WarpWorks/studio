const Base = require('./base');

class View extends Base {
    constructor(type, parent, id, name, desc) {
        super(type, parent, id, name, desc);
        this.isDefault = false;
    }

    // eslint-disable-next-line camelcase
    getParent_Entity() {
        return this.parent;
    }
}

module.exports = View;
