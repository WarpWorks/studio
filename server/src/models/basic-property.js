const Base = require('./base');

//
// Class "BasicProperty"
//

// Constructor and inheritance

function BasicProperty (entity, id, name, desc, propertyType) {
    Base.call(this, "BasicProperty", entity, id, name, desc);
    this.propertyType = propertyType;

    this.constraints = null;
    this.examples = null;

    switch (propertyType) {
        case this.getHeadStart().BasicTypes.String:
            this.defaultValue = "'text'";
            break;
        case this.getHeadStart().BasicTypes.Number:
            this.defaultValue = 0;
            break;
        case this.getHeadStart().BasicTypes.Boolean:
            this.defaultValue = true;
            break;
        case this.getHeadStart().BasicTypes.Date:
            this.defaultValue = '"' + (new Date()).toLocaleString() + '"';
            break;
        default:
            throw new Error("Invalid BasicType: " + propertyType);
    }
}
BasicProperty.prototype = Object.create(Base.prototype);
BasicProperty.prototype.constructor = BasicProperty;

// Methods

BasicProperty.prototype.getParent_Entity = function () {
    return this.parent;
};

BasicProperty.prototype.getTestData = function () {
    var testData;

    switch (this.propertyType) {
        case this.getHeadStart().BasicTypes.String:
            testData = ["Lorem", "Ipsum", "Dolor", "Amet", "Consetetur", "Sadipscing"];
            if (this.examples) testData = this.examples.split(",");
            return testData[Math.floor(Math.random() * testData.length)];
        case this.getHeadStart().BasicTypes.Number:
            return Math.floor(Math.random() * 1000);
        case this.getHeadStart().BasicTypes.Boolean:
            return Math.random() * 100 < 50;
        case this.getHeadStart().BasicTypes.Date:
            testData = ["2016/12/24", "1970/12/10", "2014/12/28", "2012/02/05", "1977/12/16"];
            return testData[Math.floor(Math.random() * testData.length)];
        default:
            throw new Error("Invalid BasicType: " + this.propertyType);
    }
};

BasicProperty.prototype.toString = function () {
    return this.name + ":" + this.propertyType;
};

BasicProperty.prototype.toJSON = function () {
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
};

