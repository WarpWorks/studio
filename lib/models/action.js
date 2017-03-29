const Base = require('./base');

class Action extends Base {
    constructor(parent, id, name, desc) {
        super("Action", parent, id, name, desc);
        this.icon = "Icon Name";
        this.label = "Label";
        this.functionName = "Function Name";
    }

    toString() {
        return this.functionName;
    }

    toJSON() {
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            id: this.idToJSON(),
            icon: this.icon,
            label: this.label,
            functionName: this.functionName
        };
    }
}
module.exports = Action;
