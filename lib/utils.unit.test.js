const _ = require('lodash');
const testHelpers = require('@quoin/node-test-helpers');

const HeadStartError = require('./headstart-error');
const utils = require('./utils');

const expect = testHelpers.expect;

describe("lib/utils", () => {
    it("should export an object", () => {
        expect(utils).to.be.an('object');
    });

    it("should expose known properties", () => {
        const clone = _.clone(utils);

        testHelpers.verifyProperties(clone, 'function', [
            'createBeginTag',
            'createEndTag',
            'extractTagValue',
            'getTokenSeq',
            'mapJSON',
            'splitBySeparator'
        ]);

        expect(clone).to.deep.equal({});
    });

    describe("createBeginTag()", () => {
        const createBeginTag = utils.createBeginTag;

        it("should be a function with 2 params", () => {
            expect(createBeginTag).to.be.a('function').to.have.lengthOf(2);
        });

        it("should create tag with only 1 param", () => {
            expect(createBeginTag('hello')).to.equal('{{hello*}}');
        });

        it("should create tag with 2 params: false", () => {
            expect(createBeginTag('hello', false)).to.equal('{{hello*}}');
        });

        it("should create tag with 2 params: true", () => {
            expect(createBeginTag('hello', true)).to.equal('{{hello?}}');
        });
    });

    describe("createEndTag()", () => {
        const createEndTag = utils.createEndTag;

        it("should be a function with 2 params", () => {
            expect(createEndTag).to.be.a('function').to.have.lengthOf(2);
        });

        it("should create tag with only 1 param", () => {
            expect(createEndTag('hello')).to.equal('{{/hello}}');
        });

        it("should create tag with 2 params: false", () => {
            expect(createEndTag('hello', false)).to.equal('{{/hello}}');
        });

        it("should create tag with 2 params: true", () => {
            expect(createEndTag('hello', true)).to.equal('{{/hello?}}');
        });
    });

    describe("extractTagValue()", () => {
        const extractTagValue = utils.extractTagValue;

        it("should be a function with 3 params", () => {
            expect(extractTagValue).to.be.a('function').to.have.lengthOf(3);
        });

        it("should throw when no params", () => {
            expect(() => extractTagValue()).to.throw(TypeError);
        });

        it("should throw when only 1 param", () => {
            expect(() => extractTagValue('foo'))
                .to.throw(HeadStartError, "Missing opening tag 'undefined'!");
        });

        it("should throw when only 2 params", () => {
            expect(() => extractTagValue('foo', 'bar'))
                .to.throw(HeadStartError, "Missing opening tag 'bar'!");
        });

        it("should throw when `openTag` not found", () => {
            expect(() => extractTagValue('foo', 'bar', ''))
                .to.throw(HeadStartError, "Missing opening tag 'bar'!");
        });

        it("should throw when `closeTag` node found", () => {
            expect(() => extractTagValue('<p>foo', '<p>', '</p>'))
                .to.throw(HeadStartError, "Missing closing tag '</p>'!");
        });

        it("should throw when `closeTag` found before `openTag`", () => {
            expect(() => extractTagValue('</p>foo<p>', '<p>', '</p>'))
                .to.throw(HeadStartError, "Opening tag '<p>' must come before closing tag '</p>'!");
        });

        it("should find content for `<p>foo</p>`", () => {
            const value = extractTagValue('<p>foo</p>', '<p>', '</p>');
            expect(value).to.deep.equal([
                "",
                "foo",
                ""
            ]);
        });

        it("should find content for `<p></p>foo</p>`", () => {
            const value = extractTagValue('<p></p>foo</p>', '<p>', '</p>');
            expect(value).to.deep.equal([
                "",
                "",
                "foo</p>"
            ]);
        });

        it("should handle '<p>foo<p>bar</p>'", () => {
            expect(extractTagValue('<p>foo<p>bar</p>', '<p>', '</p>')).to.deep.equal([
                '',
                'foo<p>bar',
                ''
            ]);
        });
    });

    describe("getTokenSeq()", () => {
        const getTokenSeq = utils.getTokenSeq;

        it("should be a function with 3 params", () => {
            expect(getTokenSeq).to.be.a('function').to.have.lengthOf(3);
        });

        it("should throw when no params", () => {
            expect(() => getTokenSeq()).to.throw(TypeError);
        });

        it("should return empty array when only 1 empty param", () => {
            expect(getTokenSeq('')).to.deep.equal([]);
        });

        it("should not be a tag value when only 1 param", () => {
            expect(getTokenSeq('foo')).to.deep.equal([{
                value: 'foo',
                isTagValue: false
            }]);
        });

        it("should throw when closeTag found, but not openTag", () => {
            expect(() => getTokenSeq('foo</p>', '<p>', '</p>'))
                .to.throw(HeadStartError, "Missing opening tag '<p>'!");
        });

        it("should throw when openTag found, but not closeTag", () => {
            expect(() => getTokenSeq('foo<p>', '<p>', '</p>'))
                .to.throw(HeadStartError, "Missing closing tag '</p>'!");
        });

        it("should throw when openTag found twice, but not closeTag twice", () => {
            expect(() => getTokenSeq('<p></p>foo<p>', '<p>', '</p>'))
                .to.throw(HeadStartError, "Missing closing tag '</p>'!");
        });

        it("should detect double openTag", () => {
            expect(() => getTokenSeq('<p>foo<p>bar</p>', '<p>', '</p>'))
                .to.throw(HeadStartError, "");
        });

        it("should handle 'foo<p></p>'", () => {
            expect(getTokenSeq('foo<p></p>', '<p>', '</p>')).to.deep.equal([{
                value: 'foo',
                isTagValue: false
            }]);
        });

        it("should handle '<p>foo</p>'", () => {
            expect(getTokenSeq('<p>foo</p>', '<p>', '</p>')).to.deep.equal([{
                value: 'foo',
                isTagValue: true
            }]);
        });

        it("should handle '<p>foo</p>bar'", () => {
            expect(getTokenSeq('<p>foo</p>bar', '<p>', '</p>')).to.deep.equal([{
                value: 'foo',
                isTagValue: true
            }, {
                value: 'bar',
                isTagValue: false
            }]);
        });
    });

    describe("mapJSON()", () => {
        const mapJSON = utils.mapJSON;

        it("should be a function with 1 param", () => {
            expect(mapJSON).to.be.a('function').to.have.lengthOf(1);
        });

        it("should return empty list when empty", () => {
            const value = [];
            const result = mapJSON(value);
            expect(result).to.deep.equal([]);
        });

        it("should call '.toJSON()' of object in list", () => {
            const item = {
                toJSON: testHelpers.stub()
            };

            const value = [item];
            mapJSON(value);

            expect(item.toJSON).to.have.been.called();
        });

        it("should call '.toJSON()' of object in list", () => {
            const item1 = {
                toJSON: testHelpers.stub()
            };
            const item2 = {
                toJSON: testHelpers.stub()
            };

            const value = [item1, item2];
            mapJSON(value);

            expect(item1.toJSON).to.have.been.called();
            expect(item2.toJSON).to.have.been.called();
        });

        it("should return expected results", () => {
            const value = [{
                toJSON() {
                    return { foo: 'bar' };
                }
            }, {
                toJSON() {
                    return { hello: 'world' };
                }
            }];
            const result = mapJSON(value);

            expect(result).to.deep.equal([
                {foo: 'bar'},
                {hello: 'world'}
            ]);
        });
    });

    describe("splitBySeparator()", () => {
        const splitBySeparator = utils.splitBySeparator;

        it("should be a function with 2 params", () => {
            expect(splitBySeparator).to.be.a('function').to.have.lengthOf(2);
        });

        it("should throw when no params", () => {
            expect(() => splitBySeparator()).to.throw(TypeError);
        });

        it("should return whole string when 1 param", () => {
            expect(splitBySeparator('foo')).to.deep.equal(["foo"]);
        });

        it("should return whole string when separator not found", () => {
            expect(splitBySeparator('foo', 'bar')).to.deep.equal(["foo"]);
        });

        it("should return 2 strings when separator found", () => {
            expect(splitBySeparator('foo:bar', ':')).to.deep.equal(["foo", "bar"]);
        });
    });
});
