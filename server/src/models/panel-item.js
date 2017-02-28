const Base = require('./base');

function PanelItem (type, parent, id, name, desc, position) {
    Base.call(this, type, parent, id, name, desc);
    this.position = position || -1;
    this.label = name;
}
PanelItem.prototype = Object.create(Base.prototype);
PanelItem.prototype.constructor = PanelItem;

PanelItem.prototype.getParent_Panel = function () {
    return this.parent;
};

module.exports = PanelItem;
