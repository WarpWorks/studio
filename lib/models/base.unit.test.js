const _ = require('lodash');
const testHelpers = require('@quoin/node-test-helpers');

const Base = require('./base');

const expect = testHelpers.expect;

describe("lib/models/base", () => {
    it("should export a class", () => {
        expect(Base).to.be.a('function')
            .to.have.property('name').to.equal('Base');
    });

    it("should have a constructor with 5 params", () => {
        expect(Base).to.have.lengthOf(5);
    });

    describe("new Base()", () => {
        it("should throw when no params", () => {
            const type = undefined;
            const parent = undefined;
            const id = undefined;
            const name = undefined;
            const desc = undefined;
            expect(() => new Base(type, parent, id, name, desc)).to.throw(Error);
        });

        it("should throw when only type is defined", () => {
            const type = 'someType';
            const parent = undefined;
            const id = undefined;
            const name = undefined;
            const desc = undefined;
            expect(() => new Base(type, parent, id, name, desc)).to.throw(Error);
        });

        it("should throw when only type, parent are defined", () => {
            const type = 'someType';
            const parent = {some: 'parent'};
            const id = undefined;
            const name = undefined;
            const desc = undefined;
            expect(() => new Base(type, parent, id, name, desc)).to.throw(Error);
        });

        it("should throw when only type, parent, id are defined", () => {
            const type = 'someType';
            const parent = {some: 'parent'};
            const id = 123;
            const name = undefined;
            const desc = undefined;
            expect(() => new Base(type, parent, id, name, desc)).to.throw(Error);
        });

        it("should not throw when desc is not defined", () => {
            const type = 'someType';
            const parent = {some: 'parent'};
            const id = 123;
            const name = 'someName';
            const desc = undefined;
            expect(() => new Base(type, parent, id, name, desc)).not.to.throw();
        });

        it("should not throw when 'name' contains space", () => {
            const type = 'someType';
            const parent = {some: 'parent'};
            const id = 123;
            const name = 'some name';
            const desc = undefined;
            expect(() => new Base(type, parent, id, name, desc)).not.to.throw();
        });

        it("should remove spaces in name", () => {
            const type = 'someType';
            const parent = {some: 'parent'};
            const id = 123;
            const name = 'some name with space';
            const desc = undefined;
            const base = new Base(type, parent, id, name, desc);

            expect(base.name).to.equal('somenamewithspace');
        });

        it("should throw when 'name' contains illegal characters", () => {
            const type = 'someType';
            const parent = {some: 'parent'};
            const id = 123;
            const name = 'some,name';
            const desc = undefined;
            expect(() => new Base(type, parent, id, name, desc))
                .to.throw(Error, "Invalid name: 'some,name'. Please use only a-z, A-Z, 0-9 or _!");
        });

        it("should expose known properties", () => {
            const type = 'someType';
            const parent = {some: 'parent'};
            const id = 123;
            const name = 'some name with space';
            const desc = 'some description';
            const base = new Base(type, parent, id, name, desc);

            const clone = _.clone(base);

            testHelpers.verifyProperties(clone, null, [
                'type',
                'parent',
                'id',
                'name',
                'desc',
                'headstart'
            ]);

            expect(clone).to.deep.equal({});
        });

        describe(".getHeadStart()", () => {
            it.skip('TODO');
        });

        describe(".getDomain()", () => {
            it.skip('TODO');
        });

        describe(".isOfType()", () => {
            it("should detect correct type", () => {
                const base = new Base('someType', null, null, 'aName', null);
                expect(base.isOfType('someType')).to.be.true();
            });

            it("should detect wrong type", () => {
                const base = new Base('someType', null, null, 'aName', null);
                expect(base.isOfType('wrongType')).to.be.false();
            });
        });

        describe(".compareToMyID()", () => {
            it.skip('TODO');
        });

        describe(".idToJSON()", () => {
            it("should return id passed in", () => {
                const base = new Base(null, null, 'thisID', 'me', null);
                expect(base.idToJSON()).to.equal('thisID');
            });
        });

        describe(".findElementByID()", () => {
            it.skip('TODO');
        });

        describe(".findElementByName()", () => {
            it.skip('TODO');
        });

        describe(".getPath()", () => {
            it("should return current if no parent", () => {
                const base = new Base(null, null, null, 'me', null);

                expect(base.getPath()).to.equal('/me');
            });

            it("should return with a parent", () => {
                const parent = new Base(null, null, null, 'parent', null);
                const base = new Base(null, parent, null, 'me', null);
                expect(base.getPath()).to.equal('/parent/me');
            });

            it("should return with a grandparent", () => {
                const grandparent = new Base(null, null, null, 'grandparent', null);
                const parent = new Base(null, grandparent, null, 'parent', null);
                const base = new Base(null, parent, null, 'me', null);
                expect(base.getPath()).to.equal('/grandparent/parent/me');
            });
        });

        describe(".processLocalTemplateFunctions()", () => {
            it.skip('TODO');
        });

        describe(".processTemplateWithChildElements()", () => {
            it.skip('TODO');
        });

        describe(".evaluateTemplateCondition()", () => {
            it.skip('TODO');
        });

        describe(".processOptions()", () => {
            it.skip('TODO');
        });

        describe(".processIfThenElse()", () => {
            it.skip('TODO');
        });

        describe(".processConditionalTagValues()", () => {
            it.skip('TODO');
        });

        describe(".processScripts()", () => {
            it.skip('TODO');
        });

        describe(".evalWithContext()", () => {
            it.skip('TODO');
        });

        describe(".saveTemplateResults()", () => {
            it.skip('TODO');
        });
    });
});
