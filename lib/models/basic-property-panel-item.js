const ComplexTypes = require('./../complex-types');
const PanelItem = require('./panel-item');

class BasicPropertyPanelItem extends PanelItem {
    constructor(parent, id, name, desc, basicProperty) {
        super("BasicPropertyPanelItem", parent, id, name, desc);
        this.label = name;

        if (basicProperty) {
            // Check if of Type "Relationship"
            if (!basicProperty.isOfType(ComplexTypes.BasicProperty)) {
                throw new Error("Create RelationshipPanelItem: Wrong Type! Expected: 'BasicProperty', was: '" + basicProperty.type + "'");
            }

            // Check if property belongs to same entity:
            var myEntity = this.parent.parent.parent;
            while (true) {
                var rel = myEntity.findElementByID(basicProperty.id, true);
                if (rel) {
                    break;
                } // ok!
                if (!myEntity.hasParentClass()) { // No more options...
                    throw new Error("Create BasicPropertyPanelItem: Target property '" + basicProperty.getPath() + "' does not belong to entity '" + myEntity.getPath() + "'");
                }
                myEntity = myEntity.getParentClass();
            }

            this.basicProperty = [basicProperty];
        }
        // Else: Property will be set later by "createInstanceFromJSON()"
    }

    hasBasicProperty() {
        return this.basicProperty && this.basicProperty.length > 0 && this.basicProperty[0] != null;
    }

    getBasicProperty() {
        return this.basicProperty[0];
    }

    setBasicProperty(bp) {
        this.basicProperty = [bp];
    }

    toString() {
        return this.name + "[=>" + (this.hasBasicProperty() ? this.getBasicProperty().name : "undefined") + "]; ";
    }

    toJSON() {
        var bp = this.hasBasicProperty() ? [this.getBasicProperty().idToJSON()] : [];
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            id: this.idToJSON(),
            position: this.position,
            label: this.label,
            basicProperty: bp
        };
    }
}

module.exports = BasicPropertyPanelItem;
