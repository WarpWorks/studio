const _ = require('lodash');
const testHelpers = require('@quoin/node-test-helpers');

const BasicTypes = require('./basic-types');

const expect = testHelpers.expect;

describe("lib/basic-types", () => {
    it("should export an object", () => {
        expect(BasicTypes).to.be.an('object');
    });

    it("should expose known properties", () => {
        const clone = _.clone(BasicTypes);

        testHelpers.verifyProperties(clone, 'string', [
            'String',
            'Number',
            'Boolean',
            'Date'
        ]);

        testHelpers.verifyProperties(clone, 'function', [
            'isValid'
        ]);

        expect(clone).to.deep.equal({});
    });

    describe("isValid()", () => {
        const isValid = BasicTypes.isValid;

        it("should accept 1 param", () => {
            expect(isValid).to.have.lengthOf(1);
        });

        it("should recognize an existing type", () => {
            expect(isValid(BasicTypes.String)).to.be.true();
        });

        it("should not recognize an invalid type", () => {
            expect(isValid('foobar')).to.be.false();
        });
    });
});
