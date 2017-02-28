const PanelItem = require('./panel-item');

//
// Class "SeparatorPanelItem"
//

// Constructor and inheritance

function SeparatorPanelItem (parent, id, position) {
    var name = "Separator";
    var desc = "---------";
    PanelItem.call(this, "SeparatorPanelItem", parent, id, name, desc, position);
    this.label = "";
}
SeparatorPanelItem.prototype = Object.create(PanelItem.prototype);
SeparatorPanelItem.prototype.constructor = SeparatorPanelItem;

// Methods

SeparatorPanelItem.prototype.toString = function () {
    return this.name + "; ";
};

SeparatorPanelItem.prototype.toJSON = function () {
    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        position: this.position,
        label: this.label,
        id: this.idToJSON()
    };
};

module.exports = SeparatorPanelItem;
