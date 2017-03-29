// const debug = require('debug')('HS:models:entity');
const Promise = require('bluebird');

const authorization = require('./../authorization');
const Base = require('./base');
const BasicProperty = require('./basic-property');
const entityOverview = require('./entity-overview');
const Enumeration = require('./enumeration');
const Relationship = require('./relationship');
const utils = require('./../utils');
const views = require('./views');

class Entity extends Base {
    constructor(domain, id, name, desc, parentClass, isRootEntity, isRootInstance) {
        super("Entity", domain, id, name, desc);
        this.isRootEntity = isRootEntity;
        this.isRootInstance = isRootInstance;
        this.isAbstract = false;
        this.namePlural = name + "s";

        if (isRootEntity) {
            // Create relationship to rootInstance
            this.setRootEntityStatus(true);
        }

        // Inheritance
        this.parentClass = parentClass ? [parentClass] : null;

        // Child elements:
        this.basicProperties = [];
        this.enums = [];
        this.relationships = [];
        this.pageViews = [];
        this.tableViews = [];
    }

    // eslint-disable-next-line camelcase
    getParent_Domain() {
        return this.parent;
    }

    setRootEntityStatus(declareAsRootEntity) {
        if (this.isRootInstance) {
            throw new Error("Can not convert RootInstance to RootEntity!");
        } else if (!declareAsRootEntity) {
            throw new Error("Currently not supported, sorry - TBD!");
        } else {
            if (this.isRootEntity) {
                return;
            } // Is already a root instance, ignore...
            var relName = this.namePlural.charAt(0).toUpperCase() + this.namePlural.slice(1);
            var rel = this.getDomain().getRootInstance().addNewRelationship(this, true, relName);
            rel.targetMax = '*';
            this.isRootEntity = true;
        }
    }

    createNewDefaultViews() {
        // TBD - Workaround: Remove existing views
        this.tableViews = [];
        this.pageViews = [];

        this.createNewDefaultTableView();
        this.createNewDefaultPageView();
        this.createNewDefaultPortalView();
    }

    createNewDefaultTableView() {
        // Create new default table view
        var newDefaultTableView = this.addNewTableView("DefaultTableView", "");
        newDefaultTableView.setAsDefault();
        var pos = 0;
        var properties = this.getBasicProperties();
        for (var i in properties) {
            var property = properties[i];
            var tableItem = newDefaultTableView.addNewTableItem(property.name, "Tooltip", property);
            tableItem.position = pos++;
        }
    }

    createNewDefaultPortalView() {
        var i;

        // Create new default page view
        var newDefaultPageView = this.addNewPageView("DefaultPortalView", "");

        // First Tab: properties, enums and associations
        var assocs = this.getAssociations();
        var properties = this.getBasicProperties();
        var enums = this.getEnums();
        var aggs = this.getAggregations();
        var basicCount = properties.length + enums.length + assocs.length + aggs.length;
        var createdAtLeastOne = false;
        if (basicCount > 0) {
            var pos = 0;
            var item = null;
            var panel = newDefaultPageView.addNewPanel("Basics", "Properties, Enums, Associations and Aggregations");
            panel.position = 0;
            for (i in properties) {
                var property = properties[i];
                item = panel.addNewBasicPropertyPanelItem(property.name, "Tooltip for " + property.name, property);
                item.position = pos++;
            }
            createdAtLeastOne = properties.length > 0;
            if (createdAtLeastOne && enums.length > 0) {
                item = panel.addNewSeparatorPanelItem();
                item.position = pos++;
            }
            for (i in enums) {
                var enumeration = enums[i];
                item = panel.addNewEnumPanelItem(enumeration.name, "Tooltip for " + enumeration.name, enumeration);
                item.position = pos++;
            }
            createdAtLeastOne = createdAtLeastOne || enums.length > 0;
            if (createdAtLeastOne && assocs.length > 2) {
                item = panel.addNewSeparatorPanelItem();
                item.position = pos++;
            }
            for (i in assocs) {
                var assoc = assocs[i];
                if (assoc.name !== "ReadAccess" && assoc.name !== "WriteAccess") {
                    item = panel.addNewRelationshipPanelItem(assoc.name, "Tooltip for " + assocs[i].name, assocs[i]);
                    item.style = "CSV";
                    item.position = pos++;
                }
            }
            createdAtLeastOne = createdAtLeastOne || assocs.length > 0;
            if (createdAtLeastOne && aggs.length > 1) {
                item = panel.addNewSeparatorPanelItem();
                item.position = pos++;
            }
            for (i in aggs) {
                var agg = aggs[i];
                if (agg.name !== "Overview") {
                    item = panel.addNewRelationshipPanelItem(agg.name, "Tooltip", aggs[i]);
                    item.style = "CSV";
                    item.position = pos++;
                }
            }
        }
    }

    /**
     *  Validates if the given `user` has write access to this entity.
     *
     *  @param {object} persistence - Persistence layer.
     *  @param {object} instance - Entity instance.
     *  @param {object} user - User to validate. See
     *      {@link ./domain.js#authenticateUser|domain.authenticateUser}
     *      for user data format.
     *  @returns {Promise} - If `user` has write access to this entity. The
     *      promise will resolve to a `boolean`.
     */
    canBeEditedBy(persistence, instance, user) {
        if (!user) {
            return Promise.resolve(false);
        }

        return Promise.reduce(
            this.getAssociations().filter(authorization.isWriteAccessRelationship),
            (canWrite, association) => {
                if (canWrite) {
                    return true;
                }

                return Promise.resolve()
                    .then(() => association.getDocuments(persistence, instance))
                    .then(authorization.hasAnyRoles.bind(null, user.Roles))
                    .then((canWrite) => {
                        if (canWrite) {
                            return true;
                        }

                        return this.getParent(persistence, instance)
                            .then((parent) => {
                                if (parent) {
                                    return parent.entity.canBeEditedBy(persistence, parent.instance, user);
                                }
                                return false;
                            });
                    });
            },
            false
        );
    }

    getOverview(persistence, instance) {
        return Promise.resolve()
            .then(() => this.getRelationships())
            .then((relationships) => relationships.filter((relationship) => relationship.name === 'Overview'))
            .then((relationships) => {
                if (relationships && relationships.length) {
                    return entityOverview(persistence, instance, relationships[relationships.length - 1]);
                }
                return null;
            });
    }

    createNewDefaultPageView() {
        var i;
        var item;
        var property;

        // Create new default page view
        var newDefaultPageView = this.addNewPageView("DefaultPageView", "");
        newDefaultPageView.setAsDefault();

        // First Tab: properties, enums and associations
        var assocs = this.getAssociations();
        var properties = this.getBasicProperties();
        var enums = this.getEnums();
        var basicCount = properties.length + enums.length + assocs.length;
        var createdAtLeastOne = false;
        if (basicCount > 0) {
            var pos = 0;
            item = null;
            var propertyPanel = newDefaultPageView.addNewPanel("Basics", "Properties, Enums and Associations");
            propertyPanel.position = 0;
            for (i in properties) {
                property = properties[i];
                item = propertyPanel.addNewBasicPropertyPanelItem(property.name, "Tooltip for " + property.name, property);
                item.position = pos++;
            }
            createdAtLeastOne = properties.length > 0;
            if (createdAtLeastOne && enums.length) {
                item = propertyPanel.addNewSeparatorPanelItem();
                item.position = pos++;
            }
            createdAtLeastOne = createdAtLeastOne || enums.length > 0;
            for (i in enums) {
                var enumeration = enums[i];
                item = propertyPanel.addNewEnumPanelItem(enumeration.name, "Tooltip for " + enumeration.name, enumeration);
                item.position = pos++;
            }
            if (createdAtLeastOne && assocs.length) {
                item = propertyPanel.addNewSeparatorPanelItem();
                item.position = pos++;
                createdAtLeastOne = true;
            }
            for (i in assocs) {
                item = propertyPanel.addNewRelationshipPanelItem(assocs[i].name, "Tooltip for " + assocs[i].name, assocs[i]);
                item.style = 'CSV';
                item.position = pos++;
            }
        }

        // Next: one tab per relationship
        var aggs = this.getAggregations();
        pos = basicCount > 0 ? 1 : 0;
        for (i in aggs) {
            var relationshipPanel = newDefaultPageView.addNewPanel(aggs[i].name, "Tooltip");
            relationshipPanel.position = pos++;
            item = relationshipPanel.addNewRelationshipPanelItem(aggs[i].name, "Tooltip", aggs[i]);
            item.style = "Table";
            item.position = 0;
        }
    }

    canBeInstantiated() {
        if (this.isRootEntity || this.isRootInstance) {
            return true;
        }
        var parentAggs = this.getAllParentAggregations();
        if (parentAggs && parentAggs.length) {
            return true;
        }
        if (this.hasParentClass()) {
            return this.getParentClass().canBeInstantiated();
        }
        return false;
    }

    createTestInstance() {
        var testInstance = {};
        testInstance.type = this.name;

        // Basic Properties
        var properties = this.getBasicProperties();
        if (properties && properties.length) {
            properties.forEach(function(property) {
                testInstance[property.name] = property.getTestData();
            });
        }

        // Enums
        var enums = this.getEnums();
        if (enums && enums.length) {
            enums.forEach(function(anEnum) {
                testInstance[anEnum.name] = anEnum.getTestData();
            });
        }
        return testInstance;
    }

    hasParentClass() {
        return this.parentClass && this.parentClass.length && this.parentClass[0] != null;
    }

    getParentClass() {
        return this.parentClass[0];
    }

    getBaseClass() {
        // BaseClass = Topmost, non-abstract class in the inheritance hierarchy
        var res = this;
        while (res.hasParentClass() && !res.getParentClass().isAbstract) {
            res = res.getParentClass();
        }
        if (res.isAbstract) {
            return null;
        }
        return res;
    }

    setParentClass(pc) {
        this.parentClass = [pc];
    }

    getBasicProperties(ignoreInheritedProperties) {
        if (!ignoreInheritedProperties && this.hasParentClass()) {
            return this.getParentClass().getBasicProperties().concat(this.basicProperties);
        }
        return this.basicProperties;
    }

    getEnums(ignoreInheritedEnums) {
        if (!ignoreInheritedEnums && this.hasParentClass()) {
            return this.getParentClass().getEnums().concat(this.enums);
        }
        return this.enums;
    }

    getPageView(viewName) {
        // Get the last items instead of the first one with `.find()`
        const foundPageViews = this.getPageViews(/*true*/).filter((pageView) => pageView.name === viewName);
        if (foundPageViews.length) {
            return foundPageViews[foundPageViews.length - 1];
        }
        return this.getDefaultPageView();
    }

    getPageViews(ignoreInheritedPageViews) {
        if (!ignoreInheritedPageViews && this.hasParentClass()) {
            return this.getParentClass().getPageViews().concat(this.pageViews);
        }
        return this.pageViews;
    }

    getDefaultPageView() {
        for (var idx = 0; idx < this.pageViews.length; idx++) {
            if (this.pageViews[idx].isDefault) {
                return this.pageViews[idx];
            }
        }
        if (this.hasParentClass()) {
            return this.getParentClass().getDefaulPageViews();
        } else {
            return null;
        }
    }

    getTableViews(ignoreInheritedTableViews) {
        if (!ignoreInheritedTableViews && this.hasParentClass()) {
            return this.getParentClass().getTableViews().concat(this.tableViews);
        }
        return this.tableViews;
    }

    getDefaultTableView() {
        for (var idx = 0; idx < this.tableViews.length; idx++) {
            if (this.tableViews[idx].isDefault) {
                return this.tableViews[idx];
            }
        }
        if (this.hasParentClass()) {
            return this.getParentClass().getDefaulTableViews();
        } else {
            return null;
        }
    }

    getRelationships(ignoreInheritedRelationships) {
        if (!ignoreInheritedRelationships && this.hasParentClass()) {
            return this.getParentClass().getRelationships().concat(this.relationships);
        }
        return this.relationships;
    }

    getAggregations(ignoreInheritedAggregations) {
        const a = this.relationships
            .filter((relationship) => relationship.isAggregation)
            .map((relationship) => relationship);

        if (!ignoreInheritedAggregations && this.hasParentClass()) {
            return this.getParentClass().getAggregations().concat(a);
        }
        return a;
    }

    getAssociations(ignoreIngeritedAssociations) {
        var a = [];
        for (var i in this.relationships) {
            if (!this.relationships[i].isAggregation) {
                a.push(this.relationships[i]);
            }
        }
        if (!ignoreIngeritedAssociations && this.hasParentClass()) {
            return a.concat(this.getParentClass().getAssociations());
        }
        return a;
    }

    // TBD: What about multiple levels of inheritance...? (eg C is B, B is A?)
    getAllDerivedEntities() {
        // Return all entities that inherit from this entity
        var domain = this.parent;
        var derivedEntities = [];
        for (var i in domain.entities) {
            var entity = domain.entities[i];
            if (entity.hasParentClass()) {
                var parent = entity.getParentClass();
                if (this.compareToMyID(parent.id)) {
                    derivedEntities.push(entity);
                }
            }
        }
        return derivedEntities;
    }

    // TBD - support inheritance!
    getAllParentAggregations() {
        // Return all aggregations which link to this entity (returns the aggregation, not the parent entity!)
        var domain = this.parent;
        var parentAggs = [];
        var entities = domain.getEntities();
        for (var i in entities) {
            var entity = entities[i];
            var aggRels = entity.getAggregations();
            for (var k in aggRels) {
                var rel = aggRels[k];
                if (rel.hasTargetEntity() && this.compareToMyID(rel.getTargetEntity().id)) {
                    parentAggs.push(rel);
                }
            }
        }
        return parentAggs;
    }

    processLocalTemplateFunctions(template) {
        var children = [
            // Without parent elements...
            ["BasicProperty", this.getBasicProperties(true)],
            ["Enumeration", this.getEnums(true)],
            ["Relationship", this.getRelationships(true)],
            ["Aggregation", this.getAggregations(true)],
            ["Association", this.getAssociations(true)],
            ["PageView", this.getPageViews(true)],
            ["TableView", this.getTableViews(true)],
            // ...and the same *with* parent elements:
            ["BasicProperty!", this.getBasicProperties(false)],
            ["Enumeration!", this.getEnums(false)],
            ["Relationship!", this.getRelationships(false)],
            ["Aggregation!", this.getAggregations(false)],
            ["Association!", this.getAssociations(false)],
            ["PageView!", this.getPageViews(false)],
            ["TableView!", this.getTableViews(false)]
            // Notice that the !-operator can be combined with the ?-operator
            // Example: {{Enumeration!?}}...{{Enumeration!}}...{{/Enumeration!}}...{{/Enumeration!?}}
        ];

        template = this.processTemplateWithChildElements(template, children);
        return super.processLocalTemplateFunctions(template);
    }

    addNewBasicProperty(name, desc, propertyType) {
        var id = this.getDomain().createNewID();
        var newBasicProperty = new BasicProperty(this, id, name, desc, propertyType);
        this.basicProperties.push(newBasicProperty);
        return newBasicProperty;
    }

    addNewEnum(name, desc) {
        var id = this.getDomain().createNewID();
        var newEnum = new Enumeration(this, id, name, desc);
        this.enums.push(newEnum);
        return newEnum;
    }

    addNewRelationship(target, isAggregation, name) {
        var id = this.getDomain().createNewID();
        if (!name) {
            name = target.namePlural;
        }
        var newRelationship = new Relationship(this, target, id, isAggregation, name);
        this.relationships.push(newRelationship);
        return newRelationship;
    }

    addNewPageView(name, desc) {
        var id = this.getDomain().createNewID();
        var newPageView = new views.PageView(this, id, name, desc);

        this.pageViews.push(newPageView);
        return newPageView;
    }

    addNewTableView(name, desc) {
        var id = this.getDomain().createNewID();
        var newTableView = new views.TableView(this, id, name, desc);
        this.tableViews.push(newTableView);
        return newTableView;
    }

    getAllElements(includeSelf) {
        var i;
        var r = [];
        if (includeSelf) {
            r = r.concat(this);
        }
        // Add children with no own children directly:
        r = r.concat(this.relationships);
        r = r.concat(this.basicProperties);
        // Children with children:
        for (i in this.enums) {
            r = r.concat(this.enums[i].getAllElements(true));
        }
        for (i in this.pageViews) {
            r = r.concat(this.pageViews[i].getAllElements(true));
        }
        for (i in this.tableViews) {
            r = r.concat(this.tableViews[i].getAllElements(true));
        }
        return r;
    }

    toString(t) {
        var comma;
        var i;
        var isFirst;
        var j;
        var result = "";
        if (!t) {
            return result;
        }

        var name = (this.isRootInstance ? '#' : '') + this.name;

        switch (t) {
            case 'properties':
                result += this.hasParentClass() ? "(" + this.getParentClass().name + ")" : "";
                if (this.enums.length || this.basicProperties.length) {
                    result += ": ";
                }
                for (i in this.basicProperties) {
                    result += (i > 0 ? ", " : "") + this.basicProperties[i].toString();
                }
                if (this.enums.length) {
                    result += ", ";
                }
                for (j in this.enums) {
                    result += (j > 0 ? ", " : "") + this.enums[j].toString();
                }
                return name + result;
            case 'aggregations':
                isFirst = true;
                for (i in this.relationships) {
                    if (this.relationships[i].isAggregation) {
                        comma = isFirst ? "" : ", ";
                        result += comma + this.relationships[i].toString();
                        isFirst = false;
                    }
                }
                return result.length ? name + ": { " + result + " }" : "";
            case 'associations':
                isFirst = true;
                for (i in this.relationships) {
                    if (!this.relationships[i].isAggregation) {
                        comma = isFirst ? "" : ", ";
                        result += comma + this.relationships[i].toString();
                        isFirst = false;
                    }
                }
                return result.length ? name + ": " + result : "";
        }
        throw new Error("Invalid option: " + t);
    }

    toJSON() {
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            id: this.idToJSON(),
            isRootEntity: this.isRootEntity,
            isRootInstance: this.isRootInstance,
            isAbstract: this.isAbstract,
            namePlural: this.namePlural,
            parentClass: this.hasParentClass() ? [this.getParentClass().id] : [],
            basicProperties: utils.mapJSON(this.basicProperties),
            enums: utils.mapJSON(this.enums),
            relationships: utils.mapJSON(this.relationships),
            pageViews: utils.mapJSON(this.pageViews),
            tableViews: utils.mapJSON(this.tableViews)
        };
    }
}

module.exports = Entity;
