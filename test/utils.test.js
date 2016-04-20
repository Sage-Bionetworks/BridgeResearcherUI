var expect = require('chai').expect;
var utils = require('../app/src/utils');

describe("utils", function() {
    describe("queryString", function() {
        it("parses no parameters into object", function() {
            var obj = utils.queryString("http://localhost:8080/#foo");
            expect(obj).to.eql({}); 
        });
        it("parses params in hash", function() {
            var obj = utils.queryString("http://localhost:8080/#foo?foo=bar&baz=bomb");
            
            expect(obj.foo).to.equal("bar");
            expect(obj.baz).to.equal("bomb"); 
        });
        it("parses params in queryString", function() {
            var obj = utils.queryString("http://localhost:8080/?name=First Last");
            
            expect(obj.name).to.equal("First Last");
        });
    });
    describe("formatISODate", function() {
        it("formats date", function() {
            expect( utils.formatISODate() ).to.match(/\d{4}-\d{2}-\d{2}/);
        });
        it("formats provided date", function() {
            expect( utils.formatISODate(new Date()) ).to.match(/\d{4}-\d{2}-\d{2}/);
        });
    });
    describe("formatVersionRange", function() {
        it("formats range", function() {
            expect( utils.formatVersionRange(0,10) ).to.equal("0-10");
            expect( utils.formatVersionRange(null,8) ).to.equal("0-8");
            expect( utils.formatVersionRange(2) ).to.equal("2+");
            expect( utils.formatVersionRange() ).to.equal("<i>All versions</i>");
        });
    });
    describe("formatTitleCase", function() {
        it("deals with empty values", function() {
            expect( utils.formatTitleCase() ).to.equal("");
            expect( utils.formatTitleCase(null) ).to.equal("");
            expect( utils.formatTitleCase("") ).to.equal("");
            expect( utils.formatTitleCase(" ") ).to.equal(" "); 
        });
        it("formats snake case", function() {
            expect( utils.formatTitleCase("one_funny_snake") ).to.equal("One funny snake");
        });
        it("formats camel case", function() {
            expect( utils.formatTitleCase("oneFunnySnake") ).to.equal("One funny snake");
        });
    });
    describe("formatName", function() {
        it("formats name", function() {
            expect( utils.formatName({firstName:"First",lastName:"Last"}) ).to.equal("First Last");
        });
        it("formats name with <EMPTY> values", function() {
            expect( utils.formatName({firstName:"<EMPTY>",lastName:"<EMPTY>"}) ).to.equal("—");
            expect( utils.formatName({firstName:"<EMPTY>",lastName:"Last"}) ).to.equal("Last");
            expect( utils.formatName({firstName:"First",lastName:"<EMPTY>"}) ).to.equal("First");
        });
        it("formats name with missing properties", function() {
            expect( utils.formatName({firstName:"First"}) ).to.equal("First");
            expect( utils.formatName({lastName:"Last"}) ).to.equal("Last");
            expect( utils.formatName({}) ).to.equal("—");
            expect( utils.formatName() ).to.equal("—");
        });
    });
});