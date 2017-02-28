const Base = require('./base');

function TableItem (parent, id, name, desc, property) {
    Base.call(this, "TableItem", parent, id, name, desc);

    // TBD: Property must be of type "property"
    // TBD: Also, only allow for properties of the current Entity
    this.property = [property];
    this.label = name;
}
TableItem.prototype = Object.create(Base.prototype);
TableItem.prototype.constructor = TableItem;

// Methods

TableItem.prototype.getParent_TableView = function () {
    return this.parent;
};

TableItem.prototype.hasProperty = function () {
    return this.property && this.property.length > 0 && this.property[0] != null;
};

TableItem.prototype.getProperty = function () {
    return this.property[0];
};

TableItem.prototype.setProperty = function (p) {
    this.property = [p];
};

TableItem.prototype.toString = function () {
    return this.name + "[=>" + (this.hasProperty() ? this.getProperty().name : "undefined") + "]; ";
};

TableItem.prototype.toJSON = function () {
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
};

module.exports = TableItem;
