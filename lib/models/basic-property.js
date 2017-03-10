const Base = require('./base');
const BasicTypes = require('./../basic-types');

class BasicProperty extends Base {
    constructor(entity, id, name, desc, propertyType) {
        super("BasicProperty", entity, id, name, desc);
        this.propertyType = propertyType;

        this.constraints = null;
        this.examples = null;

        switch (propertyType) {
            case BasicTypes.String:
                this.defaultValue = "'text'";
                break;
            case BasicTypes.Number:
                this.defaultValue = 0;
                break;
            case BasicTypes.Boolean:
                this.defaultValue = true;
                break;
            case BasicTypes.Date:
                this.defaultValue = '"' + (new Date()).toLocaleString() + '"';
                break;
            default:
                throw new Error("Invalid BasicType: " + propertyType);
        }
    }

    // eslint-disable-next-line camelcase
    getParent_Entity() {
        return this.parent;
    }

    getTestData() {
        var testData;

        switch (this.propertyType) {
            case BasicTypes.String:
                testData = ["Lorem", "Ipsum", "Dolor", "Amet", "Consetetur", "Sadipscing"];
                if (this.examples) {
                    testData = this.examples.split(",");
                }
                return testData[Math.floor(Math.random() * testData.length)];
            case BasicTypes.Number:
                return Math.floor(Math.random() * 1000);
            case BasicTypes.Boolean:
                return Math.random() * 100 < 50;
            case BasicTypes.Date:
                testData = ["2016/12/24", "1970/12/10", "2014/12/28", "2012/02/05", "1977/12/16"];
                return testData[Math.floor(Math.random() * testData.length)];
            default:
                throw new Error("Invalid BasicType: " + this.propertyType);
        }
    }

    toString() {
        return this.name + ":" + this.propertyType;
    }

    toJSON() {
        return {
            name: this.name,
            desc: this.desc,
            type: this.type,
            id: this.idToJSON(),
            defaultValue: this.defaultValue,
            constraints: this.constraints,
            examples: this.examples,
            propertyType: this.propertyType
        };
    }
}

module.exports = BasicProperty;
