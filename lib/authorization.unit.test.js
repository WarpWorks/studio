const _ = require('lodash');
const testHelpers = require('@quoin/node-test-helpers');

const authorization = require('./authorization');

const expect = testHelpers.expect;

describe("lib/authorization", () => {
    it("should export an object", () => {
        expect(authorization).to.be.an('object');
    });

    it("should expose known properties", () => {
        const clone = _.clone(authorization);

        testHelpers.verifyProperties(clone, 'function', [
            'hasAnyRoles',
            'isWriteAccessRelationship'
        ]);

        expect(clone).to.deep.equal({});
    });

    describe("hasAnyRoles()", () => {
        const hasAnyRoles = authorization.hasAnyRoles;

        it("should be a function with 2 params", () => {
            expect(hasAnyRoles).to.be.a('function').to.have.lengthOf(2);
        });

        it("should be false if no user roles", () => {
            const userRoles = undefined;
            const entityRoles = undefined;
            expect(hasAnyRoles(userRoles, entityRoles)).to.be.false();
        });

        it("should be false if empty user roles", () => {
            const userRoles = [];
            const entityRoles = undefined;
            expect(hasAnyRoles(userRoles, entityRoles)).to.be.false();
        });

        it("should be false if userRoles but no entityRoles", () => {
            const userRoles = [{}];
            const entityRoles = undefined;
            expect(hasAnyRoles(userRoles, entityRoles)).to.be.false();
        });

        it("should be false if entityRoles is empty", () => {
            const userRoles = [];
            const entityRoles = [];
            expect(hasAnyRoles(userRoles, entityRoles)).to.be.false();
        });

        it("should be false if entityRoles is empty", () => {
            const userRoles = [{}];
            const entityRoles = [];
            expect(hasAnyRoles(userRoles, entityRoles)).to.be.false();
        });

        it("should be false if no id", () => {
            const userRoles = [{}];
            const entityRoles = [{}];
            expect(hasAnyRoles(userRoles, entityRoles)).to.be.false();
        });

        it("should be false if mismatch", () => {
            const userRoles = [{id: 1}];
            const entityRoles = [{id: 2}];
            expect(hasAnyRoles(userRoles, entityRoles)).to.be.false();
        });

        it("should be false if multiple mismatch", () => {
            const userRoles = [{id: 1}, {id: 3}];
            const entityRoles = [{id: 2}, {id: 4}];
            expect(hasAnyRoles(userRoles, entityRoles)).to.be.false();
        });

        it("should be true if at least one match", () => {
            const userRoles = [{id: 1}, {id: 3}];
            const entityRoles = [{id: 2}, {id: 3}];
            expect(hasAnyRoles(userRoles, entityRoles)).to.be.true();
        });
    });

    describe("isWriteAccessRelationship()", () => {
        const isWriteAccessRelationship = authorization.isWriteAccessRelationship;

        it("should be a function with 1 param", () => {
            expect(isWriteAccessRelationship).to.be.a('function').to.have.lengthOf(1);
        });

        it("should return false when no params", () => {
            expect(isWriteAccessRelationship()).to.be.false();
        });

        it("should detect good relationship", () => {
            const relationship = {
                name: 'WriteAccess'
            };
            expect(isWriteAccessRelationship(relationship)).to.be.true();
        });

        it("should not accept wrong case", () => {
            const relationship = {
                name: 'writeaccess'
            };
            expect(isWriteAccessRelationship(relationship)).to.be.false();
        });
    });
});
