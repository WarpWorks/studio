const Promise = require('bluebird');
const Base = require('./base');

class Relationship extends Base {
    constructor(parent, target, id, isAggregation, name) {
        super("Relationship", parent, id, name, "");
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

    // eslint-disable-next-line camelcase
    getParent_Entity() {
        return this.parent;
    }

    updateDesc() {
        var target = this.hasTargetEntity() && typeof this.getTargetEntity() === "object" ? this.targetEntity[0].name : "undefined";
        if (this.isAggregation) {
            this.desc = this.name + ": " + this.parent.name + "[" + target + "] (1:" + this.getTargetCardinality() + ")";
        } else {
            this.desc = this.name + ": " + this.parent.name + "=>" + target + " (" + this.getSourceCardinality() + ":" + this.getTargetCardinality() + ")";
        }
    }

    hasTargetEntity() {
        return this.targetEntity && this.targetEntity.length > 0 && this.targetEntity[0] != null && typeof this.targetEntity[0] === "object" && this.targetEntity[0].constructor !== Array;
    }

    getTargetEntity() {
        return this.targetEntity[0];
    }

    setTargetEntity(te) {
        this.targetEntity = [te];
    }

    getTargetCardinality() {
        if (this.targetAverage === "1") {
            return "1";
        } else {
            return parseInt(this.targetAverage) < parseInt(this.getDomain().definitionOfMany) ? "Few" : "Many";
        }
    }

    getSourceCardinality() {
        if (this.sourceAverage === "1") {
            return "1";
        } else {
            return parseInt(this.sourceAverage) < parseInt(this.getDomain().definitionOfMany) ? "Few" : "Many";
        }
    }

    getDocuments(persistence, instance) {
        const targetEntity = this.getTargetEntity();

        if (this.isAggregation) {
            return targetEntity.getChildren(persistence, instance.id);
        }

        const references = instance[this.name] || [];

        if (targetEntity.isAbstract) {
            const domain = targetEntity.getDomain();
            return Promise.map(references, (reference) => {
                const nonAbstractEntity = domain.getEntityByName(reference.type);
                return nonAbstractEntity.getInstance(persistence, reference.id);
            });
        }

        return Promise.map(references,
            (reference) => targetEntity.getInstance(persistence, reference.id));
    }

    toJSON() {
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
    }

    toString() {
        var s = this.isAggregation ? ":" : "=>";
        var target = this.hasTargetEntity() ? this.getTargetEntity().name : "undefined";
        return this.name + s + target + (this.targetMax === '*' ? '*' : '');
    }
}

module.exports = Relationship;
