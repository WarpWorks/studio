const ComplexTypes = require('./../complex-types');
const PanelItem = require('./panel-item');

class RelationshipPanelItem extends PanelItem {
    constructor(parent, id, name, desc, relationship) {
        super("RelationshipPanelItem", parent, id, name, desc);
        this.label = name;
        this.style = 'CSV';

        if (relationship) {
            // Check if of Type "Relationship"
            if (!relationship.isOfType(ComplexTypes.Relationship)) {
                throw new Error("Create RelationshipPanelItem: Wrong Type! Expected: 'Relationship', was: '" + relationship.type + "'");
            }

            // Check if relationship belongs to same entity:
            var myEntity = this.parent.parent.parent;
            while (true) {
                var rel = myEntity.findElementByID(relationship.id, true);
                if (rel) {
                    break;
                } // ok!
                if (!myEntity.hasParentClass()) { // No more options...
                    throw new Error("Create RelationshipPanelItem: Target relationship '" + relationship.getPath() + "' does not belong to entity '" + myEntity.getPath() + "'");
                }
                myEntity = myEntity.getParentClass();
            }

            this.setRelationship(relationship);
        }
        // Else: relationship will be set later by "createInstanceFromJSON()"
    }

    hasRelationship() {
        return this.relationship && this.relationship.length > 0 && this.relationship[0] != null;
    }

    getRelationship() {
        return this.relationship[0];
    }

    setRelationship(r) {
        this.relationship = [r];
    }

    toString() {
        return this.name + "[=>" + this.getRelationship().name + "]; ";
    }

    toJSON() {
        var rid = this.hasRelationship() ? [this.getRelationship().idToJSON()] : [];
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            style: this.style,
            id: this.idToJSON(),
            position: this.position,
            label: this.label,
            relationship: rid
        };
    }
}
module.exports = RelationshipPanelItem;
