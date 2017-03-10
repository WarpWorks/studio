const Base = require('./base');

class TableItem extends Base {
    constructor(parent, id, name, desc, property) {
        super("TableItem", parent, id, name, desc);

        // TBD: Property must be of type "property"
        // TBD: Also, only allow for properties of the current Entity
        this.property = [property];
        this.label = name;
    }

    // eslint-disable-next-line camelcase
    getParent_TableView() {
        return this.parent;
    }

    hasProperty() {
        return this.property && this.property.length > 0 && this.property[0] != null;
    }

    getProperty() {
        return this.property[0];
    }

    setProperty(p) {
        this.property = [p];
    }

    toString() {
        return this.name + "[=>" + (this.hasProperty() ? this.getProperty().name : "undefined") + "]; ";
    }

    toJSON() {
        var p = this.hasProperty() ? [this.getProperty().idToJSON()] : [];
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            id: this.idToJSON(),
            position: this.position,
            label: this.label,
            property: p
        };
    }
}

module.exports = TableItem;
