const Base = require('./base');
const TableItem = require('./table-item');
const View = require('./view');

function TableView (parent, id, name, desc) {
    View.call(this, "TableView", parent, id, name, desc);
    this.label = name;
    this.tableItems = [];
}
TableView.prototype = Object.create(View.prototype);
TableView.prototype.constructor = TableView;

// Methods

TableView.prototype.addNewTableItem = function (name, desc, property) {
    var id = this.getDomain().createNewID();
    var newTableItem = new TableItem(this, id, name, desc, property);
    this.tableItems.push(newTableItem);
    return newTableItem;
};

TableView.prototype.setAsDefault = function () {
    for (var i in this.parent.tableViews) { this.parent.tableViews[i].isDefault = false; }
    this.isDefault = true;
};

TableView.prototype.getAllElements = function (includeSelf) {
    var r = [];
    if (includeSelf) { r = r.concat(this); }
    for (var i in this.tableItems) r = r.concat(this.tableItems[i]);
    return r;
};

TableView.prototype.toString = function () {
    var s = this.name + " [";
    for (var i in this.tableItems) s += this.tableItems[i].toString();
    return s + "]; ";
};

TableView.prototype.toJSON = function () {
    var ti = [];
    for (var i in this.tableItems) ti.push(this.tableItems[i].toJSON());

    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        label: this.label,
        isDefault: this.isDefault,
        tableItems: ti
    };
};

TableView.prototype.processLocalTemplateFunctions = function (template) {
    var children = [["TableItem", this.tableItems]];

    template = this.processTemplateWithChildElements(template, children);
    return Base.prototype.processLocalTemplateFunctions.call(this, template);
};

module.exports = TableView;
