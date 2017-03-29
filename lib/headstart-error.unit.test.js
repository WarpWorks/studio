const testHelpers = require('@quoin/node-test-helpers');

const HeadStartError = require('./headstart-error');

const expect = testHelpers.expect;

describe("lib/headstart-error", () => {
    it("should export an error class", () => {
        const err = new HeadStartError("a message");
        expect(err).to.be.an.instanceof(HeadStartError);
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal("a message");
        expect(err.originalError).to.be.undefined();
    });
});
