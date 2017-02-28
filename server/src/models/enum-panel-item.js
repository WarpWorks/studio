const PanelItem = require('./panel-item');

function EnumPanelItem (parent, id, name, desc, enumeration) {
    PanelItem.call(this, "EnumPanelItem", parent, id, name, desc);
    this.label = name;

    if (enumeration) {
        // Check if of Type "Enumeration"
        if (!enumeration.isOfType(this.getHeadStart().ComplexTypes.Enumeration)) {
            throw new Error("Create RelationshipPanelItem: Wrong Type! Expected: 'Enumeration', was: '" + enumeration.type + "'");
        }

        // Check if enum belongs to same entity:
        var myEntity = this.parent.parent.parent;
        while (true) {
            var rel = myEntity.findElementByID(enumeration.id, true);
            if (rel) { break; } // ok!
            if (!myEntity.getParentClass()) { // No more options...
                throw new Error("Create BasicPropertyPanelItem: Target enum '" + enumeration.getPath() + "' does not belong to entity '" + myEntity.getPath() + "'");
            }
            myEntity = myEntity.getParentClass();
        }

        this.setEnumeration(enumeration);
    }
    // Else: enumeration will be set later by "createInstanceFromJSON()"
}
EnumPanelItem.prototype = Object.create(PanelItem.prototype);
EnumPanelItem.prototype.constructor = EnumPanelItem;

// Methods

EnumPanelItem.prototype.hasEnumeration = function () {
    return this.enumeration && this.enumeration.length > 0 && this.enumeration[0] != null;
};

EnumPanelItem.prototype.getEnumeration = function () {
    return this.enumeration[0];
};

EnumPanelItem.prototype.setEnumeration = function (e) {
    this.enumeration = [e];
};

EnumPanelItem.prototype.toString = function () {
    return this.name + "[=>" + this.enumeration.name + "]; ";
};

EnumPanelItem.prototype.toJSON = function () {
    var eid = this.hasEnumeration() ? [this.getEnumeration().idToJSON()] : [];
    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        position: this.position,
        label: this.label,
        enumeration: eid
    };
};

module.exports = EnumPanelItem;
