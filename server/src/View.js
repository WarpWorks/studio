//
// ------------------------------------------------------------------------------------------------------------
// View Elements
// ------------------------------------------------------------------------------------------------------------
//

var model = require ('./Model.js');

//
// Class "PanelItem"
//

function PanelItem (type, parent, id, name, desc, position) {
    model.Base.call(this, type, parent, id, name, desc);
    this.position = position ? position : -1;
    this.label = name;
}
PanelItem.prototype = Object.create(model.Base.prototype);
PanelItem.prototype.constructor = PanelItem;

PanelItem.prototype.getParent_Panel = function () {
    return this.parent;
}


//
// Class "SeparatorPanelItem"
//

// Constructor and inheritance

function SeparatorPanelItem (parent, id, position) {
    var name = "Separator";
    var desc = "---------";
    PanelItem.call(this, "SeparatorPanelItem", parent, id, name, desc, position);
    this.label = "";
}
SeparatorPanelItem.prototype = Object.create(PanelItem.prototype);
SeparatorPanelItem.prototype.constructor = SeparatorPanelItem;

// Methods

SeparatorPanelItem.prototype.toString = function () {
    return this.name+"; ";
}

SeparatorPanelItem.prototype.toJSON = function () {
    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        position: this.position,
        label: this.label,
        id: this.idToJSON()
    }
}


//
// Class "RelationshipPanelItem"
//

// Constructor and inheritance

function RelationshipPanelItem (parent, id, name, desc, relationship) {
    PanelItem.call(this, "RelationshipPanelItem", parent, id, name, desc);
    this.label = name;

    if (relationship) {

        // Check if of Type "Relationship"
        if (!relationship.isOfType(this.getHeadStart().ComplexTypes.Relationship))
            throw ("Create RelationshipPanelItem: Wrong Type! Expected: 'Relationship', was: '" + relationship.type + "'");

        // Check if relationship belongs to same entity:
        var myEntity = this.parent.parent.parent;
        while (true) {
            var rel = myEntity.findElementByID(relationship.id, true);
            if (rel)
                break; // ok!
            if (!myEntity.hasParentClass()) // No more options...
                throw ("Create RelationshipPanelItem: Target relationship '" + relationship.getPath() + "' does not belong to entity '" + myEntity.getPath() + "'");
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
    return this.relationship && this.relationship.length>0 && this.relationship[0]!=null;
}

RelationshipPanelItem.prototype.getRelationship = function () {
    return this.relationship[0];
}

RelationshipPanelItem.prototype.setRelationship = function (r) {
    this.relationship = [r];
}

RelationshipPanelItem.prototype.toString = function () {
    return this.name+"[=>"+this.getRelationship().name+"]; ";
}

RelationshipPanelItem.prototype.toJSON = function () {
    var rid = this.hasRelationship() ? [this.getRelationship().idToJSON()] : [];
    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        position: this.position,
        label: this.label,
        relationship: rid
    }
}

//
// Class "BasicPropertyPanelItem"
//

// Constructor and inheritance

function BasicPropertyPanelItem (parent, id, name, desc, basicProperty) {
    PanelItem.call(this, "BasicPropertyPanelItem", parent, id, name, desc);
    this.label = name;

    if (basicProperty) {
        // Check if of Type "Relationship"
        if (!basicProperty.isOfType(this.getHeadStart().ComplexTypes.BasicProperty))
            throw ("Create RelationshipPanelItem: Wrong Type! Expected: 'BasicProperty', was: '" + basicProperty.type + "'");

        // Check if property belongs to same entity:
        var myEntity = this.parent.parent.parent;
        while (true) {
            var rel = myEntity.findElementByID(basicProperty.id, true);
            if (rel)
                break; // ok!
            if (!myEntity.hasParentClass()) // No more options...
                throw ("Create BasicPropertyPanelItem: Target property '" + basicProperty.getPath() + "' does not belong to entity '" + myEntity.getPath() + "'");
            myEntity = myEntity.getParentClass();
        }

        this.basicProperty = [basicProperty];
    }
    // Else: Property will be set later by "createInstanceFromJSON()"
}
BasicPropertyPanelItem.prototype = Object.create(PanelItem.prototype);
BasicPropertyPanelItem.prototype.constructor = BasicPropertyPanelItem;

// Methods

BasicPropertyPanelItem.prototype.hasBasicProperty = function () {
    return this.basicProperty && this.basicProperty.length>0 && this.basicProperty[0]!=null;;
}

BasicPropertyPanelItem.prototype.getBasicProperty = function () {
    return this.basicProperty[0];
}

BasicPropertyPanelItem.prototype.setBasicProperty = function (bp) {
    this.basicProperty = [bp];
}

BasicPropertyPanelItem.prototype.toString = function () {
    return this.name+"[=>"+(this.hasBasicProperty()?this.getBasicProperty().name:"undefined")+"]; ";
    return s;
}

BasicPropertyPanelItem.prototype.toJSON = function () {
    var bp = this.hasBasicProperty() ? [this.getBasicProperty().idToJSON()] : [];
    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        position: this.position,
        label: this.label,
        basicProperty: bp
    }
}


//
// Class "EnumPanelItem"
//

// Constructor and inheritance

function EnumPanelItem (parent, id, name, desc, enumeration) {
    PanelItem.call(this, "EnumPanelItem", parent, id, name, desc);
    this.label = name;

    if (enumeration) {

        // Check if of Type "Enumeration"
        if (!enumeration.isOfType(this.getHeadStart().ComplexTypes.Enumeration))
            throw ("Create RelationshipPanelItem: Wrong Type! Expected: 'Enumeration', was: '" + enumeration.type + "'");

        // Check if enum belongs to same entity:
        var myEntity = this.parent.parent.parent;
        while (true) {
            var rel = myEntity.findElementByID(enumeration.id, true);
            if (rel)
                break; // ok!
            if (!myEntity.getParentClass()) // No more options...
                throw ("Create BasicPropertyPanelItem: Target enum '" + enumeration.getPath() + "' does not belong to entity '" + myEntity.getPath() + "'");
            myEntity = myEntity.getParentClass();
        }

        this.setEnumeration (enumeration);
    }
    // Else: enumeration will be set later by "createInstanceFromJSON()"
}
EnumPanelItem.prototype = Object.create(PanelItem.prototype);
EnumPanelItem.prototype.constructor = EnumPanelItem;

// Methods

EnumPanelItem.prototype.hasEnumeration = function () {
    return this.enumeration && this.enumeration.length>0 && this.enumeration[0]!=null;
}

EnumPanelItem.prototype.getEnumeration = function () {
    return this.enumeration[0];
}

EnumPanelItem.prototype.setEnumeration = function (e) {
    this.enumeration = [e];
}

EnumPanelItem.prototype.toString = function () {
    return this.name+"[=>"+this.enumeration.name+"]; ";
    return s;
}

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
    }
}


//
// Class "Panel"
//

// Constructor and inheritance

function Panel (parent, id, name, desc) {
    model.Base.call(this, "Panel", parent, id, name, desc);
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
Panel.prototype = Object.create(model.Base.prototype);
Panel.prototype.constructor = Panel;

// Methods

Panel.prototype.getParent_PageView = function () {
    return this.parent;
}


Panel.prototype.addNewSeparatorPanelItem = function () {
    var id = this.getDomain().createNewID();
    var newSeparatorPanelItem = new SeparatorPanelItem (this, id);
    this.separatorPanelItems.push (newSeparatorPanelItem);
    return newSeparatorPanelItem;
}

Panel.prototype.addNewRelationshipPanelItem = function (name, desc, relationship) {
    var id = this.getDomain().createNewID();
    var newRelationshipPanelItem = new RelationshipPanelItem (this, id, name, desc, relationship);
    this.relationshipPanelItems.push (newRelationshipPanelItem);
    return newRelationshipPanelItem;
}

Panel.prototype.addNewBasicPropertyPanelItem = function (name, desc, basicProperty) {
    var id = this.getDomain().createNewID();
    var newBasicPropertyPanelItem = new BasicPropertyPanelItem (this, id, name, desc, basicProperty);
    this.basicPropertyPanelItems.push (newBasicPropertyPanelItem);
    return newBasicPropertyPanelItem;
}

Panel.prototype.addNewEnumPanelItem = function (name, desc, enumeration) {
    var id = this.getDomain().createNewID();
    var newEnumPanelItem = new EnumPanelItem (this, id, name, desc, enumeration);
    this.enumPanelItems.push (newEnumPanelItem);
    return newEnumPanelItem;
}

Panel.prototype.getAllPanelItems = function () {
    var r = new Array (10);
    r = r.concat (this.separatorPanelItems);
    r = r.concat (this.relationshipPanelItems);
    r = r.concat (this.basicPropertyPanelItems);
    r = r.concat (this.enumPanelItems);
    return r;
}

Panel.prototype.getAllElements = function (includeSelf)
{
    var r = new Array ();
    if (includeSelf)
        r = r.concat(this);
    r = r.concat (this.getAllPanelItems());
    return r;
}

Panel.prototype.toString = function () {
    var s = this.name+" [";
    var panelItems = this.getAllPanelItems();
    for (i in panelItems) s+= panelItems[i].toString();
    return s+"]; ";
}

Panel.prototype.toJSON = function () {
    var spi = [];
    var rpi = [];
    var bppi = [];
    var epi = [];
    for (i in this.separatorPanelItems) spi.push(this.separatorPanelItems[i].toJSON());
    for (i in this.relationshipPanelItems) rpi.push(this.relationshipPanelItems[i].toJSON());
    for (i in this.basicPropertyPanelItems) bppi.push(this.basicPropertyPanelItems[i].toJSON());
    for (i in this.enumPanelItems) epi.push(this.enumPanelItems[i].toJSON());

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
    }
}

Panel.prototype.processLocalTemplateFunctions = function (template) {
    var aggregationPanelItems = [];
    var associationPanelItems = [];
    for (var i in this.relationshipPanelItems) {
        var rpi = this.relationshipPanelItems[i];
        var reln = rpi.getRelationship();
        if (rpi.getRelationship().isAggregation)
            aggregationPanelItems.push(rpi);
        else
            associationPanelItems.push(rpi);
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
    return model.Base.prototype.processLocalTemplateFunctions.call (this, template);
}

//
// Class "View"
//

function View (type, parent, id, name, desc) {
    model.Base.call(this, type, parent, id, name, desc);
    this.isDefault = false;
}
View.prototype = Object.create(model.Base.prototype);
View.prototype.constructor = View;

View.prototype.getParent_Entity = function () {
    return this.parent;
}

//
// Class "PageView"
//

// Constructor and inheritance

function PageView (parent, id, name, desc) {
    View.call(this, "PageView", parent, id, name, desc);
    this.label = name;
    this.panels = [];
}
PageView.prototype = Object.create(View.prototype);
PageView.prototype.constructor = PageView;

// Methods

PageView.prototype.addNewPanel = function (name, desc) {
    var id = this.getDomain().createNewID();
    var newPanel = new Panel (this, id, name, desc);
    this.panels.push (newPanel);
    return newPanel;
}

PageView.prototype.setAsDefault = function () {
    for (i in this.parent.pageViews)
        this.parent.pageViews[i].isDefault = false;
    this.isDefault = true;
}


PageView.prototype.getAllElements = function (includeSelf)
{
    var r = new Array ();
    if (includeSelf)
        r = r.concat(this);
    for (i in this.panels) r = r.concat(this.panels[i].getAllElements(true));
    return r;
}

PageView.prototype.toString = function () {
    var s = this.name+" [";
    for (i in this.panels) s += this.panels[i].toString();
    return s+"]; ";
}

PageView.prototype.toJSON = function () {
    var p = [];
    for (i in this.panels) p.push(this.panels[i].toJSON());

    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        isDefault: this.isDefault,
        id: this.idToJSON(),
        label: this.label,
        panels: p
    }
}

PageView.prototype.processLocalTemplateFunctions = function (template) {
    var children = [["Panel", this.panels]];

    template = this.processTemplateWithChildElements(template, children);
    return model.Base.prototype.processLocalTemplateFunctions.call (this, template);
}

//
// Class "TableItem"
//

// Constructor and inheritance

function TableItem (parent, id, name, desc, property) {
    model.Base.call(this, "TableItem", parent, id, name, desc);

    // TBD: Property must be of type "property"
    // TBD: Also, only allow for properties of the current Entity
    this.property = [property];
    this.label = name;
}
TableItem.prototype = Object.create(model.Base.prototype);
TableItem.prototype.constructor = TableItem;

// Methods

TableItem.prototype.getParent_TableView = function () {
    return this.parent;
}

TableItem.prototype.hasProperty = function () {
    return this.property && this.property.length>0 && this.property[0]!=null;
}

TableItem.prototype.getProperty = function () {
    return this.property[0];
}

TableItem.prototype.setProperty = function (p) {
    this.property = [p];
}

TableItem.prototype.toString = function () {
    return this.name+"[=>"+(this.hasProperty()?this.getProperty().name:"undefined")+"]; ";
}

TableItem.prototype.toJSON = function () {
    var p = this.hasProperty() ? [this.getProperty().idToJSON()] : [];
    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        position: this.position,
        label: this.label,
        property: p
    }
}


//
// Class "TableView"
//

// Constructor and inheritance

function TableView (parent, id, name, desc) {
    View.call(this, "TableView", parent, id, name, desc);
    this.label = name;
    this.tableItems = [];
}
TableView.prototype = Object.create(View.prototype);
TableView.prototype.constructor = TableView;

// Methods

TableView.prototype.addNewTableItem = function (name, desc, property) {
    var id = this.getDomain().createNewID();
    var newTableItem = new TableItem (this, id, name, desc, property);
    this.tableItems.push (newTableItem);
    return newTableItem;
}

TableView.prototype.setAsDefault = function () {
    for (i in this.parent.tableViews)
        this.parent.tableViews[i].isDefault = false;
    this.isDefault = true;
}

TableView.prototype.getAllElements = function (includeSelf)
{
    var r = new Array ();
    if (includeSelf)
        r = r.concat(this);
    for (i in this.tableItems) r = r.concat(this.tableItems[i]);
    return r;
}

TableView.prototype.toString = function () {
    var s = this.name+" [";
    for (i in this.tableItems) s += this.tableItems[i].toString();
    return s+"]; ";
}

TableView.prototype.toJSON = function () {
    var ti = [];
    for (i in this.tableItems) ti.push(this.tableItems[i].toJSON());

    return {
        name: this.name,
        desc: this.desc,
        type: this.type,
        id: this.idToJSON(),
        label: this.label,
        isDefault: this.isDefault,
        tableItems: ti
    }
}

TableView.prototype.processLocalTemplateFunctions = function (template) {
    var children = [["TableItem", this.tableItems]];

    template = this.processTemplateWithChildElements(template, children);
    return model.Base.prototype.processLocalTemplateFunctions.call (this, template);
}

//
// ------------------------------------------------------------------------------------------------------------
// Export modules
// ------------------------------------------------------------------------------------------------------------
//

// Functions:
exports.PageView = PageView;
exports.TableView = TableView;
exports.Panel = Panel;
exports.PanelItem = PanelItem;
exports.SeparatorPanelItem = SeparatorPanelItem;
exports.RelationshipPanelItem = RelationshipPanelItem;
exports.BasicPropertyPanelItem = BasicPropertyPanelItem;
exports.EnumPanelItem = EnumPanelItem;
exports.TableItem = TableItem;
