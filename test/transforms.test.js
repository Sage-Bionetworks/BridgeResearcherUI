var expect = require('chai').expect;
var fn = require('../app/src/transforms');

describe("transforms", function() {
    describe("formatName", function() {
        it("formats name", function() {
            expect( fn.formatName({firstName:"First",lastName:"Last"}) ).to.equal("First Last");
        });
        it("formats name with <EMPTY> values", function() {
            expect( fn.formatName({firstName:"<EMPTY>",lastName:"<EMPTY>"}) ).to.equal("—");
            expect( fn.formatName({firstName:"<EMPTY>",lastName:"Last"}) ).to.equal("Last");
            expect( fn.formatName({firstName:"First",lastName:"<EMPTY>"}) ).to.equal("First");
        });
        it("formats name with missing properties", function() {
            expect( fn.formatName({firstName:"First"}) ).to.equal("First");
            expect( fn.formatName({lastName:"Last"}) ).to.equal("Last");
            expect( fn.formatName({}) ).to.equal("—");
            expect( fn.formatName() ).to.equal("—");
        });
    });
    describe("formatTitleCase", function() {
        it("deals with empty values", function() {
            expect( fn.formatTitleCase() ).to.equal("");
            expect( fn.formatTitleCase(null) ).to.equal("");
            expect( fn.formatTitleCase("") ).to.equal("");
            expect( fn.formatTitleCase(" ") ).to.equal(" "); 
        });
        it("formats snake case", function() {
            expect( fn.formatTitleCase("one_funny_snake") ).to.equal("One funny snake");
        });
        it("formats camel case", function() {
            expect( fn.formatTitleCase("oneFunnySnake") ).to.equal("One funny snake");
        });
    });
});