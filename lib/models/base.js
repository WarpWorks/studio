// const debug = require('debug')('HS:models:base');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

// BasicTypes is used in the eval()!
// eslint-disable-next-line no-unused-vars
const BasicTypes = require('./../basic-types');
const ComplexTypes = require('./../complex-types');
const utils = require('./../utils');

function isValidName(name) {
    return !/\W/i.test(name) && name.length > 1;
}

class Base {
    constructor(type, parent, id, name, desc) {
        // Set basic attributes first (needed for validation below)
        this.type = type;
        this.parent = parent;
        this.id = id;
        this.name = name.replace(/ /g, ''); // Remove whitespaces
        this.desc = desc;

        // Validate name
        if (!isValidName(this.name)) {
            throw new Error("Invalid name: '" + name + "'. Please use only a-z, A-Z, 0-9 or _!");
        }

        /* TBD: Decide if we want to enforce unique names within a domain?
        var duplicate = this.getDomain().findElementByName(name);
        if (duplicate && duplicate != this)
            throw "Error creating element of type '"+type+"'! Name '"+name+"' already used by element of type '"+duplicate.type+"' in same domain!";
        */

        // This is the top-level element; it will be resolved dynamically
        this.headstart = (parent && parent.constructor.name === 'HeadStart') ? parent : null;
    }

    getHeadStart() {
        if (!this.headstart) {
            this.headstart = this.parent.getHeadStart();
        }
        return this.headstart;
    }

    getDomain() {
        if (this.type !== ComplexTypes.Domain) {
            return this.parent.getDomain();
        }
        return this;
    }

    isOfType(t) {
        return this.type === t;
    }

    compareToMyID(id) {
        return this.getDomain().compareIDs(this.id, id);
    }

    idToJSON() {
        return this.id;
    }

    findElementByID(id) {
        var allElems = this.getAllElements(true);
        for (var i in allElems) {
            if (this.getDomain().compareIDs(id, allElems[i].id)) {
                var r = allElems[i];
                return r;
            }
        }
        return null;
    }

    findElementByName(name, type) {
        var allElems = this.getAllElements(true);
        for (var i in allElems) {
            if ((allElems[i].name === name) &&
                            (!type || allElems[i].type === type)) {
                return allElems[i];
            }
        }
        return null;
    }

    getParent(persistence, instance) {
        return Promise.resolve()
            .then(() => this.getDomain().getParentEntityByParentBaseClassName(instance))
            .then((parentEntity) => {
                if (parentEntity) {
                    return parentEntity.getInstance(persistence, instance.parentID)
                        .then((parentInstance) => {
                            return {
                                entity: parentEntity,
                                instance: parentInstance
                            };
                        });
                }
                return {
                    entity: parentEntity,
                    instance: null
                };
            });
    }

    getPath() {
        return (this.parent ? this.parent.getPath() : '') + `/${this.name}`;
    }

    getInstancePath(persistence, instance) {
        return Promise.resolve()
            .then(() => this.getParent(persistence, instance))
            .then((parent) => {
                if (parent && parent.instance) {
                    return parent.entity.getInstancePath(persistence, parent.instance);
                }
                return [];
            })
            .then((ancestors) => {
                return ancestors.concat({
                    type: instance.type,
                    id: instance.id,
                    name: instance.Name || instance.type
                });
            });
    }

    getInstance(persistence, id) {
        // Should look in the top most non-abstract class.
        let name;
        if (this.getBaseClass) {
            name = this.getBaseClass().name;
        } else {
            name = this.name;
        }
        return persistence.findOne(name, { _id: id }, true);
    }

    getDocuments(persistence) {
        return persistence.documents(this.name);
    }

    getChildren(persistence, parentID) {
        return persistence.documents(this.name, { parentID }, true);
    }

    //
    // Template Processing
    //

    processLocalTemplateFunctions(template) {
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
    }

    processTemplateWithChildElements(template, children) {
        var i;
        for (var idx in children) {
            var child = children[idx];
            var type = child[0];
            var elements = child[1];
            var beginTag = utils.createBeginTag(type);
            var endTag = utils.createEndTag(type);

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
    }

    evaluateTemplateCondition(template) {
        if (!template.includes("{{Options}}")) {
            return true;
        }
        var a = utils.extractTagValue(template, "{{Options}}", "{{/Options}}");
        var options = JSON.parse(a[1]);
        if (!options.condition) {
            return true;
        }
        return this.evalWithContext(options.condition);
    }

    processOptions(template) {
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
    }

    processIfThenElse(template) {
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
    }

    processConditionalTagValues(template, type, removeContent) {
        var begin = utils.createBeginTag(type, true);
        var end = utils.createEndTag(type, true);

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
    }

    processScripts(template) {
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
                console.log("Stack:", err.stack);
            }

            template = template.replace(begin + script + end, scriptResult);
        }
        return template;
    }

    evalWithContext(js) {
        // Return the results of the in-line anonymous function we call with the passed context
        return (function() {
            // eslint-disable-next-line no-eval
            return eval(js);
        }.call(this));
    }

    saveTemplateResults(result, target) {
        if (!target || target.length !== 2) {
            throw new Error("Invalid target in 'onSave'-option!");
        }

        var fn = this.evalWithContext(target[1]);
        if (target[0] === '.') {
            fn = path.join(process.cwd(), 'public', 'HeadStart', fn);
        } else {
            fn = path.join(this.getHeadStart().getDir("output"), target[0], fn);
        }

        fs.writeFileSync(fn, result);
    }
}

module.exports = Base;
