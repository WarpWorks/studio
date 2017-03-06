const TableItem = require('./table-item');
const utils = require('./../utils');
const View = require('./view');

class TableView extends View {
    constructor(parent, id, name, desc) {
        super("TableView", parent, id, name, desc);
        this.label = name;
        this.tableItems = [];
    }

    addNewTableItem(name, desc, property) {
        var id = this.getDomain().createNewID();
        var newTableItem = new TableItem(this, id, name, desc, property);
        this.tableItems.push(newTableItem);
        return newTableItem;
    }

    setAsDefault() {
        for (var i in this.parent.tableViews) {
            this.parent.tableViews[i].isDefault = false;
        }
        this.isDefault = true;
    }

    getAllElements(includeSelf) {
        var r = [];
        if (includeSelf) {
            r = r.concat(this);
        }
        for (var i in this.tableItems) {
            r = r.concat(this.tableItems[i]);
        }
        return r;
    }

    toString() {
        var s = this.name + " [";
        for (var i in this.tableItems) {
            s += this.tableItems[i].toString();
        }
        return s + "]; ";
    }

    toJSON() {
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            id: this.idToJSON(),
            label: this.label,
            isDefault: this.isDefault,
            tableItems: utils.mapJSON(this.tableItems)
        };
    }

    processLocalTemplateFunctions(template) {
        var children = [["TableItem", this.tableItems]];

        template = this.processTemplateWithChildElements(template, children);
        return super.processLocalTemplateFunctions(template);
    }
}

module.exports = TableView;
