const PanelItem = require('./panel-item');

//
// Class "RelationshipPanelItem"
//

// Constructor and inheritance

function RelationshipPanelItem (parent, id, name, desc, relationship) {
    PanelItem.call(this, "RelationshipPanelItem", parent, id, name, desc);
    this.label = name;
    this.style = 'CSV';

    if (relationship) {
        // Check if of Type "Relationship"
        if (!relationship.isOfType(this.getHeadStart().ComplexTypes.Relationship)) {
            throw new Error("Create RelationshipPanelItem: Wrong Type! Expected: 'Relationship', was: '" + relationship.type + "'");
        }

        // Check if relationship belongs to same entity:
        var myEntity = this.parent.parent.parent;
        while (true) {
            var rel = myEntity.findElementByID(relationship.id, true);
            if (rel) { break; } // ok!
            if (!myEntity.hasParentClass()) { // No more options...
                throw new Error("Create RelationshipPanelItem: Target relationship '" + relationship.getPath() + "' does not belong to entity '" + myEntity.getPath() + "'");
            }
            myEntity = myEntity.getParentClass();
        }

        this.setRelationship(relationship);
    }
    // Else: relationship will be set later by "createInstanceFromJSON()"
}
RelationshipPanelItem.prototype = Object.create(PanelItem.prototype);
RelationshipPanelItem.prototype.constructor = RelationshipPanelItem;

// Methods

RelationshipPanelItem.prototype.hasRelationship = function () {
    return this.relationship && this.relationship.length > 0 && this.relationship[0] != null;
};

RelationshipPanelItem.prototype.getRelationship = function () {
    return this.relationship[0];
};

RelationshipPanelItem.prototype.setRelationship = function (r) {
    this.relationship = [r];
};

RelationshipPanelItem.prototype.toString = function () {
    return this.name + "[=>" + this.getRelationship().name + "]; ";
};

RelationshipPanelItem.prototype.toJSON = function () {
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
};

module.exports = RelationshipPanelItem;
