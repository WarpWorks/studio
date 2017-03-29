const testHelpers = require('@quoin/node-test-helpers');

const View = require('./view');

const expect = testHelpers.expect;

describe("lib/models/view", () => {
    it("should export a class", () => {
        expect(View).to.be.a('function')
            .to.have.property('name').to.equal('View');
    });

    it("should have a constructor with 5 params", () => {
        expect(View).to.have.lengthOf(5);
    });
});
