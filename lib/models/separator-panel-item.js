const PanelItem = require('./panel-item');

class SeparatorPanelItem extends PanelItem {
    constructor(parent, id, position) {
        var name = "Separator";
        var desc = "---------";
        super("SeparatorPanelItem", parent, id, name, desc, position);
        this.label = "";
    }

    toString() {
        return this.name + "; ";
    }

    toJSON() {
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            position: this.position,
            label: this.label,
            id: this.idToJSON()
        };
    }
}

module.exports = SeparatorPanelItem;
