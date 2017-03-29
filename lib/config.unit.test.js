const _ = require('lodash');
const testHelpers = require('@quoin/node-test-helpers');

const config = require('./config');

const expect = testHelpers.expect;

describe("server/config", () => {
    it("should export an object", () => {
        expect(config).to.be.an('object');
    });

    it("should expose known properties", () => {
        const clone = _.clone(config);

        testHelpers.verifyProperties(clone, 'string', [
            'cartridgePath',
            'mongoServer',
            'outputPath',
            'port',
            'projectPath',
            'serverStarted',
            'serverVersion'
        ]);

        expect(clone).to.deep.equal({});
    });
});
