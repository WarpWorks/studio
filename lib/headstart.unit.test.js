const _ = require('lodash');
const testHelpers = require('node-test-helpers');

const hs = require('./headstart');

const expect = testHelpers.expect;

describe("lib/headstart", () => {
    it("should be an instance", () => {
        expect(hs).to.be.an.instanceof(hs.constructor);
    });

    it("should expose known properties", () => {
        const clone = _.clone(hs);

        testHelpers.verifyProperties(clone, null, [
            'config',
            'domains',
            'mongoDBs',
            'parent'
        ]);

        expect(clone).to.deep.equal({});
    });

    describe("createNewDomain()", () => {
        it("should be a function with 3 params", () => {
            expect(hs).to.have.property('createNewDomain')
                .to.be.a('function').to.have.lengthOf(3);
        });

        it("should create and return a new domain", () => {
            const domain = hs.createNewDomain('aName', 'aDescription', false);
            expect(domain).to.be.an.instanceof(domain.constructor);
            expect(domain.constructor.name).to.equal('Domain');
        });
    });

    describe("getAllDomains()", () => {
        it("should be a function with no params", () => {
            expect(hs).to.have.property('getAllDomains')
                .to.be.a('function').to.have.length(0);
        });

        it("should return `this.domains`", () => {
            expect(hs.getAllDomains()).to.deep.equal(hs.domains);
        });
    });

    describe("getDomainByName()", () => {
        it("should be a function with 1 param", () => {
            expect(hs).to.have.property('getDomainByName')
                .to.be.a('function').to.have.lengthOf(1);
        });

        it("should fail for unknown domain", () => {
            expect(() => hs.getDomainByName('foo')).to.throw();
        });
    });

    describe("toString()", () => {
        it("should be a function with no params", () => {
            expect(hs).to.have.property('toString')
                .to.be.a('function').to.have.lengthOf(0);
        });

        it("should return representation", () => {
            expect(hs.toString()).to.be.a('string');
        });
    });

    describe("getDir()", () => {
        it("should be a function with 2 params", () => {
            expect(hs).to.have.property('getDir')
                .to.be.a('function').to.have.lengthOf(2);
        });

        it("should throw when no params", () => {
            expect(() => hs.getDir()).to.throw(Error, "a");
        });

        it("should return path for 'smnDemos'", () => {
            const value = hs.getDir('smnDemos');
            expect(value).to.be.a('string');
        });

        it("should return path for 'templates'", () => {
            const value = hs.getDir('templates');
            expect(value).to.be.a('string');
        });

        it("should return path for 'output'", () => {
            const value = hs.getDir('output');
            expect(value).to.be.a('string');
        });
    });

    describe("readFile()", () => {
        it("should be a function with 1 param", () => {
            expect(hs).to.have.property('readFile')
                .to.be.a('function').to.have.lengthOf(1);
        });

        it("should throw when no params", () => {
            expect(() => hs.readFile()).to.throw(Error);
        });
    });
});
