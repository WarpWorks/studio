const Base = require('./base');

//
// Class "Relationship"
//

// Constructor and inheritance

function Relationship(parent, target, id, isAggregation, name) {
    Base.call(this, "Relationship", parent, id, name, "");
    this.isAggregation = isAggregation;
    this.targetEntity = [target];
    this.sourceRole = "Source Role";
    this.sourceMin = "1";
    this.sourceMax = "*";
    this.sourceAverage = "/";
    this.targetRole = "Target Role";
    this.targetMin = "0";
    this.targetMax = "*";
    this.targetAverage = "/";

    this.updateDesc();
}
Relationship.prototype = Object.create(Base.prototype);
Relationship.prototype.constructor = Relationship;

// Methods

Relationship.prototype.getParent_Entity = function() {
    return this.parent;
};

Relationship.prototype.updateDesc = function() {
    var target = this.hasTargetEntity() && typeof this.getTargetEntity() === "object" ? this.targetEntity[0].name : "undefined";
    if (this.isAggregation) {
        this.desc = this.name + ": " + this.parent.name + "[" + target + "] (1:" + this.getTargetCardinality() + ")";
    } else {
        this.desc = this.name + ": " + this.parent.name + "=>" + target + " (" + this.getSourceCardinality() + ":" + this.getTargetCardinality() + ")";
    }
};

Relationship.prototype.hasTargetEntity = function() {
    return this.targetEntity && this.targetEntity.length > 0 && this.targetEntity[0] != null && typeof this.targetEntity[0] === "object" && this.targetEntity[0].constructor !== Array;
};

Relationship.prototype.getTargetEntity = function() {
    return this.targetEntity[0];
};

Relationship.prototype.setTargetEntity = function(te) {
    this.targetEntity = [te];
};

Relationship.prototype.getTargetCardinality = function() {
    if (this.targetAverage === "1") {
        return "1";
    } else {
        return parseInt(this.targetAverage) < parseInt(this.getDomain().definitionOfMany) ? "Few" : "Many";
    }
};
Relationship.prototype.getSourceCardinality = function() {
    if (this.sourceAverage === "1") {
        return "1";
    } else {
        return parseInt(this.sourceAverage) < parseInt(this.getDomain().definitionOfMany) ? "Few" : "Many";
    }
};

Relationship.prototype.toJSON = function() {
    var tid = this.hasTargetEntity() ? [this.getTargetEntity().idToJSON()] : [];
    var res = {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        isAggregation: this.isAggregation,
        targetEntity: tid,
        sourceRole: this.sourceRole,
        sourceMin: this.sourceMin,
        sourceMax: this.sourceMax,
        sourceAverage: this.sourceAverage,
        targetRole: this.targetRole,
        targetMin: this.targetMin,
        targetMax: this.targetMax,
        targetAverage: this.targetAverage
    };
    return res;
};

Relationship.prototype.toString = function() {
    var s = this.isAggregation ? ":" : "=>";
    var target = this.hasTargetEntity() ? this.getTargetEntity().name : "undefined";
    return this.name + s + target + (this.targetMax === '*' ? '*' : '');
};

