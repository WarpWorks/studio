const Base = require('./base');
const Panel = require('./panel');
const View = require('./view');

function PageView(parent, id, name, desc) {
    View.call(this, "PageView", parent, id, name, desc);
    this.label = name;
    this.panels = [];
}
PageView.prototype = Object.create(View.prototype);
PageView.prototype.constructor = PageView;

// Methods

PageView.prototype.addNewPanel = function(name, desc) {
    var id = this.getDomain().createNewID();
    var newPanel = new Panel(this, id, name, desc);
    this.panels.push(newPanel);
    return newPanel;
};

PageView.prototype.setAsDefault = function() {
    for (var i in this.parent.pageViews) {
        this.parent.pageViews[i].isDefault = false;
    }
    this.isDefault = true;
};

PageView.prototype.getAllElements = function(includeSelf) {
    var r = [];
    if (includeSelf) {
        r = r.concat(this);
    }
    for (var i in this.panels) {
        r = r.concat(this.panels[i].getAllElements(true));
    }
    return r;
};

PageView.prototype.toString = function() {
    var s = this.name + " [";
    for (var i in this.panels) {
        s += this.panels[i].toString();
    }
    return s + "]; ";
};

PageView.prototype.toJSON = function() {
    var p = [];
    for (var i in this.panels) {
        p.push(this.panels[i].toJSON());
    }

    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        isDefault: this.isDefault,
        id: this.idToJSON(),
        label: this.label,
        panels: p
    };
};

PageView.prototype.processLocalTemplateFunctions = function(template) {
    var children = [["Panel", this.panels]];

    template = this.processTemplateWithChildElements(template, children);
    return Base.prototype.processLocalTemplateFunctions.call(this, template);
};

module.exports = PageView;
