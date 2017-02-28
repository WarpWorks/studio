const Base = require('./base');

function View(type, parent, id, name, desc) {
    Base.call(this, type, parent, id, name, desc);
    this.isDefault = false;
}
View.prototype = Object.create(Base.prototype);
View.prototype.constructor = View;

View.prototype.getParent_Entity = function() {
    return this.parent;
};

module.exports = View;
