console.log("API OK!");

//
// Class "HealthInsurance"
//

// Constructor
function HealthInsurance(type, parent, id, isEmptyShell) {
    // Initialize base class
    ProductDefinition.call(this, type, parent, id, isEmptyShell);

    // Enumerations:
    this.Type = "";
}

// Inheritance
HealthInsurance.prototype = Object.create(ProductDefinition.prototype);
HealthInsurance.prototype.constructor = HealthInsurance;

// Definitions for Enumerations
HealthInsurance.prototype.enumDef_Type = ["General", "Dental"];

//
// Methods
//

HealthInsurance.prototype.updatePropertiesWithQueryResults = function(qr) {
    this.isEmptyShell = false;
    this._id = qr._id;
};

HealthInsurance.prototype.propertiesOnly = function(qr) {
    var propertiesOnly = {};
    return propertiesOnly;
};

//
// Class "ProductDefinition"
//

// Constructor
function ProductDefinition(type, parent, id, isEmptyShell) {
    // Initialize base class

    Base.call(this, type, parent, id, isEmptyShell);

    // Properties:
    this.ProductID = 'text';
    this.validSince = "2017-01-11 11:11:46";
    this.isActive = true;
}

// Inheritance
ProductDefinition.prototype = Object.create(Base.prototype);
ProductDefinition.prototype.constructor = ProductDefinition;

//
// Methods
//

ProductDefinition.prototype.updatePropertiesWithQueryResults = function(qr) {
    this.isEmptyShell = false;
    this._id = qr._id;
    this._ProductID = qr.ProductID;
    this._validSince = qr.validSince;
    this._isActive = qr.isActive;
};

ProductDefinition.prototype.get_ProductID = function() {
    return this._ProductID;
};
ProductDefinition.prototype.set_ProductID = function(value) {
    if (this._ProductID === value) {
        return;
    }
    this._ProductID = value; this.properties_Changed = true;
};
ProductDefinition.prototype.get_validSince = function() {
    return this._validSince;
};
ProductDefinition.prototype.set_validSince = function(value) {
    if (this._validSince === value) {
        return;
    }
    this._validSince = value; this.properties_Changed = true;
};
ProductDefinition.prototype.get_isActive = function() {
    return this._isActive;
};
ProductDefinition.prototype.set_isActive = function(value) {
    if (this._isActive === value) {
        return;
    }
    this._isActive = value; this.properties_Changed = true;
};

ProductDefinition.prototype.propertiesOnly = function(qr) {
    var propertiesOnly = {};
    propertiesOnly._id = this.id;
    propertiesOnly.targetType = this.type;
    propertiesOnly.ProductID = this.get_ProductID();
    propertiesOnly.validSince = this.get_validSince();
    propertiesOnly.isActive = this.get_isActive();

    return propertiesOnly;
};

/*
function Base(type, parent, id, isEmptyShell) {
}
Base.prototype.compareToMyID = function (id) {
    console.log("ok");
}

function ProductDefinition (type, parent, id, isEmptyShell) {
    // Initialize base class
    Base.call(this, type, parent, id, isEmptyShell);

    // Properties:
    this.ProductID='text';
    this.validSince="2017-01-11 11:11:46";
    this.isActive=true;
}
// Inheritance
ProductDefinition.prototype = Object.create(Base.prototype);
ProductDefinition.prototype.constructor = ProductDefinition;
ProductDefinition.prototype.get_ProductID = function () { return 123; };

function HealthInsurance (type, parent, id, isEmptyShell) {
    // Initialize base class
    ProductDefinition.call(this, type, parent, id, isEmptyShell);

    // Enumerations:
    this.Type="";

}
// Inheritance
HealthInsurance.prototype = Object.create(ProductDefinition.prototype);
HealthInsurance.prototype.constructor = HealthInsurance;

var test = new HealthInsurance();
test.compareToMyID();
console.log("ID:"+test.get_ProductID());
*/
