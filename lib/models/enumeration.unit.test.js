const testHelpers = require('@quoin/node-test-helpers');

const Enumeration = require('./enumeration');

const expect = testHelpers.expect;

describe("lib/models/enumeration", () => {
    it("should be a class", () => {
        expect(Enumeration).to.be.a('function')
            .to.have.property('name').to.equal('Enumeration');
    });

    it("constructor accepts 4 params", () => {
        expect(Enumeration).to.have.lengthOf(4);
    });
});
