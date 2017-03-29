const _ = require('lodash');
const testHelpers = require('@quoin/node-test-helpers');

const views = require('./views');

const expect = testHelpers.expect;

describe("lib/models/views", () => {
    it("should export an object", () => {
        expect(views).to.be.an('object');
    });

    it("should expose known properties", () => {
        const clone = _.clone(views);

        testHelpers.verifyProperties(clone, 'function', [
            'Action',
            'BasicPropertyPanelItem',
            'EnumPanelItem',
            'PageView',
            'Panel',
            'PanelItem',
            'RelationshipPanelItem',
            'SeparatorPanelItem',
            'TableItem',
            'TableView'
        ]);

        expect(clone).to.deep.equal({});
    });
});
