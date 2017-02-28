const path = require('path');

const utils = require('./../utils');

//
// Class "Base"
//

// Constructor

function Base(type, parent, id, name, desc) {
    // Set basic attributes first (needed for validation below)
    this.type = type;
    this.parent = parent;
    this.id = id;
    this.name = name.replace(/ /g, ''); // Remove whitespaces
    this.desc = desc;

    // Validate name
    if (!this.isValidName(name)) {
        throw new Error("Invalid name: '" + name + "'. Please use only a-z, A-Z, 0-9 or _!");
    }

    /* TBD: Decide if we want to enforce unique names within a domain?
    var duplicate = this.getDomain().findElementByName(name);
    if (duplicate && duplicate != this)
        throw "Error creating element of type '"+type+"'! Name '"+name+"' already used by element of type '"+duplicate.type+"' in same domain!";
    */

    // This is the top-level element; it will be resolved dynamically
    this.headstart = null;
}

// Getter / setter

// Methods

Base.prototype.isValidName = function(name) {
    return !/\W/i.test(name) && name.length > 1;
};

Base.prototype.getHeadStart = function() {
    if (!this.headstart) {
        this.headstart = this;
        while (this.headstart.parent) {
            this.headstart = this.headstart.parent;
        }
    }
    var res = this.headstart;
    return res;
};

Base.prototype.getDomain = function() {
    var domain = this;
    while (domain.type !== "Domain") {
        domain = domain.parent;
    }
    return domain;
};

Base.prototype.isOfType = function(t) {
    return this.type === t;
};

Base.prototype.compareToMyID = function(id) {
    return this.getDomain().compareIDs(this.id, id);
};

Base.prototype.idToJSON = function() {
    return this.id;
};

Base.prototype.findElementByID = function(id) {
    var allElems = this.getAllElements(true);
    for (var i in allElems) {
        if (this.getDomain().compareIDs(id, allElems[i].id)) {
            var r = allElems[i];
            return r;
        }
    }
    return null;
};

Base.prototype.findElementByName = function(name, type) {
    var allElems = this.getAllElements(true);
    for (var i in allElems) {
        if ((allElems[i].name === name) &&
                            (!type || allElems[i].type === type)) {
            return allElems[i];
        }
    }
    return null;
};

Base.prototype.getPath = function() {
    var s = this.name;
    var p = this.parent;
    while (p) {
        s = p.name + "/" + s;
        p = p.parent;
    }
    return "/" + s;
};

//
// Template Processing
//

Base.prototype.processLocalTemplateFunctions = function(template) {
    // Evaluate "condition" in "{{Options}}"
    if (!this.evaluateTemplateCondition(template)) {
        return null;
    }

    // Process if/then/else tags
    template = this.processIfThenElse(template);

    // Execute scriptlets:
    template = this.processScripts(template);

    // Perform actions in options, e.g. "saveAs"
    template = this.processOptions(template);

    return template;
};

Base.prototype.processTemplateWithChildElements = function(template, children) {
    var i;
    for (var idx in children) {
        var child = children[idx];
        var type = child[0];
        var elements = child[1];
        var beginTag = this.getHeadStart().createBeginTag(type);
        var endTag = this.getHeadStart().createEndTag(type);

        var tokenSeq = utils.getTokenSeq(template, beginTag, endTag);
        for (i in tokenSeq) {
            if (tokenSeq[i].isTagValue) {
                var ts = "";
                var itemPos = 0;
                var hasExecutedAtLeastOnce = false;
                if (elements) {
                    elements.forEach(function(childElem) {
                        // Declare some temporary variables that can be used in the template`s java scriptlets:
                        childElem.itemPos = itemPos;
                        childElem.itemIsFirst = itemPos === 0;

                        // Apply template to child element:
                        var res = childElem.processLocalTemplateFunctions(tokenSeq[i].value);
                        if (res) {
                            ts += res;
                            itemPos++;
                            hasExecutedAtLeastOnce = true;
                        }

                        // And now remove temporary variables:
                        delete childElem.itemPos;
                        delete childElem.itemIsFirst;
                    });
                }
                tokenSeq[i].value = ts;
            }
        }

        // Re-construct template from token sequence
        template = "";
        for (i in tokenSeq) {
            template += tokenSeq[i].value;
        }

        // If no elements available, remove conditional tags, e.g. {{Entity?}} ... {{/Entity?}}
        template = this.processConditionalTagValues(template, type, !hasExecutedAtLeastOnce);
    }
    return template;
};

Base.prototype.evaluateTemplateCondition = function(template) {
    if (!template.includes("{{Options}}")) {
        return true;
    }
    var a = utils.extractTagValue(template, "{{Options}}", "{{/Options}}");
    var options = JSON.parse(a[1]);
    if (!options.condition) {
        return true;
    }
    return this.evalWithContext(options.condition);
};

Base.prototype.processOptions = function(template) {
    if (template.includes("{{Options}}")) {
        var a = utils.extractTagValue(template, "{{Options}}", "{{/Options}}");

        // Re-construct template
        template = a[0] + a[2];
        if (template.includes("{{Options}}")) {
            throw new Error("{{Options}} should only be included once!");
        }

        var options = JSON.parse(a[1]);
        if (options.saveAs) {
            var target = options.saveAs;
            this.saveTemplateResults(template, target);
        }
    }
    return template;
};

Base.prototype.processIfThenElse = function(template) {
    while (template.includes("{{if}}")) {
        var beforeIteAfter = utils.extractTagValue(template, "{{if}}", "{{/if}}");
        var ifthenelse = null;

        if (beforeIteAfter[1].includes("{{else}}")) {
            ifthenelse = utils.extractTagValue(beforeIteAfter[1], "{{then}}", "{{else}}");
        } else {
            ifthenelse = utils.splitBySeparator(beforeIteAfter[1], "{{then}}");
        }

        var ifexp = ifthenelse[0];
        var condition = this.evalWithContext(ifexp);

        var res = "";

        if (condition) {
            // keep the 'if' part
            res = ifthenelse[1];
        }
        if (!condition && ifthenelse.length === 3) {
            // else was defined, keep else part
            res = ifthenelse[2];
        }

        template = beforeIteAfter[0] + res + beforeIteAfter[2];
    }
    return template;
};

Base.prototype.processConditionalTagValues = function(template, type, removeContent) {
    var begin = this.getHeadStart().createBeginTag(type, true);
    var end = this.getHeadStart().createEndTag(type, true);

    while (template.includes(begin)) {
        var res = utils.extractTagValue(template, begin, end);
        if (res.length !== 3) {
            throw new Error("Error");
        }
        if (removeContent) {
            // Remove content
            template = res[0] + res[2];
        } else {
            // Return everything (minus the tags)
            template = res[0] + res[1] + res[2];
        }
    }
    return template;
};

Base.prototype.processScripts = function(template) {
    if (template === null) {
        throw new Error("Internal error");
    }
    var begin = "{{js:";
    var end = "/}}";
    while (template.includes(begin)) {
        var tokens = utils.extractTagValue(template, begin, end);
        // var pre = tokens[0];
        var script = tokens[1];
        // var post = tokens[2];

        try {
            var scriptResult = this.evalWithContext(script);
        } catch (err) {
            console.log("While processing scriptlet in template:");
            console.log("Element level:" + this.name);
            console.log("Scriptlet:" + tokens);
            console.log("Error: " + err);
        }

        template = template.replace(begin + script + end, scriptResult);
    }
    return template;
};

Base.prototype.evalWithContext = function(js) {
    // Return the results of the in-line anonymous function we call with the passed context
    return (function() {
        // eslint-disable-next-line no-eval
        return eval(js);
    }.call(this));
};

Base.prototype.saveTemplateResults = function(result, target) {
    if (!target || target.length !== 2) {
        throw new Error("Invalid target in 'onSave'-option!");
    }

    var fn = this.evalWithContext(target[1]);
    if (target[0] === '.') {
        fn = path.join(process.cwd(), 'public', 'HeadStart', fn);
    } else {
        fn = path.join(this.getHeadStart().getDir("output"),  target[0], fn);
    }

    var fs = require('fs');
    fs.writeFile(fn, result, function(err) {
        if (err) {
            return console.log("*** Error: " + err);
        }
        console.log("New file generated: '" + fn + "'");
    });
};

//
// END Base Template Processing
//

module.exports = Base;
