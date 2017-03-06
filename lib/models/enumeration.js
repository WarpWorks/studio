const Base = require('./base');
const Literal = require('./literal');
const utils = require('./../utils');
const ValidEnumSelections = require('./../valid-enum-selections');

class Enumeration extends Base {
    constructor(entity, id, name, desc) {
        super("Enumeration", entity, id, name, desc);
        this.validEnumSelections = ValidEnumSelections.ZeroOne;
        this.literals = [];
    }

    // eslint-disable-next-line camelcase
    getParent_Entity() {
        return this.parent;
    }

    processLocalTemplateFunctions(template) {
        var children = [["Literal", this.literals]];
        template = this.processTemplateWithChildElements(template, children);
        return super.processLocalTemplateFunctions(template);
    }

    addNewLiteral(name, desc, validSelection) {
        var id = this.getDomain().createNewID();
        var newLiteral = new Literal(this, id, name, desc, validSelection);
        this.literals.push(newLiteral);
        return newLiteral;
    }

    getAllElements(includeSelf) {
        var r = [];
        if (includeSelf) {
            r = r.concat(this);
        }
        // Add children with no own children directly:
        r = r.concat(this.literals);
        return r;
    }

    getTestData() {
        if (this.literals && this.literals.length > 0) {
            return this.literals[Math.floor(Math.random() * this.literals.length)].name;
        } else {
            return "Undefined";
        }
    }

    toString() {
        const literals = this.literals.map((literal) => literal.toString()).join("|");
        return `${this.name}:[${literals}]`;
    }

    toJSON() {
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            id: this.idToJSON(),
            literals: utils.mapJSON(this.literals)
        };
    }
}

module.exports = Enumeration;
