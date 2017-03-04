const Base = require('./base');

class PanelItem extends Base {
    constructor(type, parent, id, name, desc, position) {
        super(type, parent, id, name, desc);
        this.position = position || -1;
        this.label = name;
    }

    // eslint-disable-next-line camelcase
    getParent_Panel() {
        return this.parent;
    }
}

module.exports = PanelItem;
