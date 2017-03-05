const Base = require('./base');
const BasicPropertyPanelItem = require('./basic-property-panel-item');
const EnumPanelItem = require('./enum-panel-item');
const RelationshipPanelItem = require('./relationship-panel-item');
const SeparatorPanelItem = require('./separator-panel-item');

class Panel extends Base {
    constructor(parent, id, name, desc) {
        super("Panel", parent, id, name, desc);
        this.position = null;
        this.columns = 1;
        this.alternatingColors = false;
        this.label = name;

        // Children:
        this.separatorPanelItems = [];
        this.relationshipPanelItems = [];
        this.basicPropertyPanelItems = [];
        this.enumPanelItems = [];
    }

    // eslint-disable-next-line camelcase
    getParent_PageView() {
        return this.parent;
    }

    addNewSeparatorPanelItem() {
        var id = this.getDomain().createNewID();
        var newSeparatorPanelItem = new SeparatorPanelItem(this, id);
        this.separatorPanelItems.push(newSeparatorPanelItem);
        return newSeparatorPanelItem;
    }

    addNewRelationshipPanelItem(name, desc, relationship) {
        var id = this.getDomain().createNewID();
        var newRelationshipPanelItem = new RelationshipPanelItem(this, id, name, desc, relationship);
        this.relationshipPanelItems.push(newRelationshipPanelItem);
        return newRelationshipPanelItem;
    }

    addNewBasicPropertyPanelItem(name, desc, basicProperty) {
        var id = this.getDomain().createNewID();
        var newBasicPropertyPanelItem = new BasicPropertyPanelItem(this, id, name, desc, basicProperty);
        this.basicPropertyPanelItems.push(newBasicPropertyPanelItem);
        return newBasicPropertyPanelItem;
    }

    addNewEnumPanelItem(name, desc, enumeration) {
        var id = this.getDomain().createNewID();
        var newEnumPanelItem = new EnumPanelItem(this, id, name, desc, enumeration);
        this.enumPanelItems.push(newEnumPanelItem);
        return newEnumPanelItem;
    }

    getAllPanelItems() {
        var r = new Array(10);
        r = r.concat(this.separatorPanelItems);
        r = r.concat(this.relationshipPanelItems);
        r = r.concat(this.basicPropertyPanelItems);
        r = r.concat(this.enumPanelItems);
        return r;
    }

    getAllElements(includeSelf) {
        var r = [];
        if (includeSelf) {
            r = r.concat(this);
        }
        r = r.concat(this.getAllPanelItems());
        return r;
    }

    toString() {
        var s = this.name + " [";
        var panelItems = this.getAllPanelItems();
        for (var i in panelItems) {
            s += panelItems[i].toString();
        }
        return s + "]; ";
    }

    toJSON() {
        var i;
        var spi = [];
        var rpi = [];
        var bppi = [];
        var epi = [];
        for (i in this.separatorPanelItems) {
            spi.push(this.separatorPanelItems[i].toJSON());
        }
        for (i in this.relationshipPanelItems) {
            rpi.push(this.relationshipPanelItems[i].toJSON());
        }
        for (i in this.basicPropertyPanelItems) {
            bppi.push(this.basicPropertyPanelItems[i].toJSON());
        }
        for (i in this.enumPanelItems) {
            epi.push(this.enumPanelItems[i].toJSON());
        }

        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            id: this.idToJSON(),
            position: this.position,
            label: this.label,
            columns: this.columns,
            alternatingColors: this.alternatingColors,
            // Children:
            separatorPanelItems: spi,
            relationshipPanelItems: rpi,
            basicPropertyPanelItems: bppi,
            enumPanelItems: epi
        };
    }

    processLocalTemplateFunctions(template) {
        var aggregationPanelItems = [];
        var associationPanelItems = [];
        for (var i in this.relationshipPanelItems) {
            var rpi = this.relationshipPanelItems[i];
            // var reln = rpi.getRelationship();
            if (rpi.getRelationship().isAggregation) {
                aggregationPanelItems.push(rpi);
            } else {
                associationPanelItems.push(rpi);
            }
        }

        var children = [
            ["SeparatorPanelItem", this.separatorPanelItems],
            ["RelationshipPanelItem", this.relationshipPanelItems],
            ["AggregationPanelItem", aggregationPanelItems],
            ["AssociationPanelItem", associationPanelItems],
            ["BasicPropertyPanelItem", this.basicPropertyPanelItems],
            ["EnumPanelItem", this.enumPanelItems]
        ];

        template = this.processTemplateWithChildElements(template, children);
        return super.processLocalTemplateFunctions(template);
    }
}

module.exports = Panel;
