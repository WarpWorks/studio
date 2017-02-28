const Base = require('./base');
const Literal = require('./literal');

//
// Class "Enumeration"
//

// Constructor and inheritance

function Enumeration(entity, id, name, desc) {
    Base.call(this, "Enumeration", entity, id, name, desc);
    this.validEnumSelections = this.getHeadStart().ValidEnumSelections.ZeroOne;
    this.literals = [];
}
Enumeration.prototype = Object.create(Base.prototype);
Enumeration.prototype.constructor = Enumeration;

// Methods

Enumeration.prototype.getParent_Entity = function() {
    return this.parent;
};

Enumeration.prototype.processLocalTemplateFunctions = function(template) {
    var children = [["Literal", this.literals]];
    template = this.processTemplateWithChildElements(template, children);
    return Base.prototype.processLocalTemplateFunctions.call(this, template);
};

Enumeration.prototype.addNewLiteral = function(name, desc, validSelection) {
    var id = this.getDomain().createNewID();
    var newLiteral = new Literal(this, id, name, desc, validSelection);
    this.literals.push(newLiteral);
    return newLiteral;
};

Enumeration.prototype.getAllElements = function(includeSelf) {
    var r = [];
    if (includeSelf) {
        r = r.concat(this);
    }
    // Add children with no own children directly:
    r = r.concat(this.literals);
    return r;
};

Enumeration.prototype.getTestData = function() {
    if (this.literals && this.literals.length > 0) {
        return this.literals[Math.floor(Math.random() * this.literals.length)].name;
    } else {
        return "Undefined";
    }
};

Enumeration.prototype.toString = function() {
    var s = this.name + ":[";
    for (var i in this.literals) {
        var l = this.literals[i].toString();
        if (i !== 0) {
            l = "|" + l;
        }
        s += l;
    }
    return s + "]";
};

Enumeration.prototype.toJSON = function() {
    var l = [];
    for (var i in this.literals) {
        l.push(this.literals[i].toJSON());
    }

    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        literals: l
    };
};

module.exports = Enumeration;
