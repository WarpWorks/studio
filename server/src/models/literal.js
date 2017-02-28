const Base = require('./base');

//
// Class "Literal"
//

// Constructor and inheritance

function Literal (enumeration, id, name, desc) {
    Base.call(this, "Literal", enumeration, id, name, desc);
    this.position = null;
    this.icon = null;
}
Literal.prototype = Object.create(Base.prototype);
Literal.prototype.constructor = Literal;

// Methods

Literal.prototype.getParent_Enumeration = function () {
    return this.parent;
};

Literal.prototype.toString = function () {
    return this.name;
};

Literal.prototype.toJSON = function () {
    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON()
    };
};

module.exports = Literal;
