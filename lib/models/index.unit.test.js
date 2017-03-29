const _ = require('lodash');
const testHelpers = require('@quoin/node-test-helpers');

const index = require('./index');

const expect = testHelpers.expect;

describe("lib/models/index", () => {
    it("should export an object", () => {
        expect(index).to.be.an('object');
    });

    it("should expose known properties", () => {
        const clone = _.clone(index);

        testHelpers.verifyProperties(clone, 'function', [
            'Base',
            'BasicProperty',
            'Domain',
            'Entity',
            'Enumeration',
            'Literal',
            'Relationship'
        ]);

        testHelpers.verifyProperties(clone, 'object', [
            'views'
        ]);

        expect(clone).to.deep.equal({});
    });
});
