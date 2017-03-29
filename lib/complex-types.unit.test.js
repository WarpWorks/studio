const _ = require('lodash');
const testHelpers = require('@quoin/node-test-helpers');

const ComplexTypes = require('./complex-types');

const expect = testHelpers.expect;

describe("lib/complex-types", () => {
    it("should export an object", () => {
        expect(ComplexTypes).to.be.an('object');
    });

    it("should expose known properties", () => {
        const clone = _.clone(ComplexTypes);

        testHelpers.verifyProperties(clone, 'string', [
            'Action',
            'Domain',
            'Entity',
            'BasicProperty',
            'Enumeration',
            'Literal',
            'Relationship',
            'PageView',
            'Panel',
            'SeparatorPanelItem',
            'RelationshipPanelItem',
            'BasicPropertyPanelItem',
            'EnumPanelItem',
            'TableView',
            'TableItem'
        ]);

        expect(clone).to.deep.equal({});
    });
});
