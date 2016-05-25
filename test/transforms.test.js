var expect = require('chai').expect;
var fn = require('../app/src/transforms');
var ko = require('knockout');

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
    describe("formatAttributes", function() {
        var context = {
            vm: {
                attributesObs: ko.observable([
                    {key:"foo", obs: ko.observable()},
                    {key:"bar", obs: ko.observable()}
                ])
            }
        }
        var result = fn.formatAttributes({
            "foo":"1","bar":"2"
        }, context);
        expect(result[0].key).to.equal("foo");
        expect(result[0].obs()).to.equal("1");
        expect(result[1].key).to.equal("bar");
        expect(result[1].obs()).to.equal("2");
    });
    describe("formatHealthCode", function() {
        var context = { vm: { study: { healthCodeExportEnabled: false } } };
        expect( fn.formatHealthCode("ABC", context) ).to.equal("N/A");
        
        context = { vm: { study: { healthCodeExportEnabled: true } } };
        expect( fn.formatHealthCode("ABC", context) ).to.equal("ABC");
    });
    describe("formatLanguages", function() {
        expect( fn.formatLanguages(["en","fr"]) ).to.eql("en, fr");
        expect( fn.formatLanguages(undefined) ).to.equal("");
        expect( fn.formatLanguages(null) ).to.equal("");
        expect( fn.formatLanguages([]) ).to.equal("");
    });
    describe("formatRoles", function() {
        var roles = ["developer","researcher", "admin", "test_users", "worker"];
        var targetRoles = ["Developer", "Researcher", "Administrator", "Test users", "Worker"];
        
        var formattedRoles = fn.formatRoles(roles);
        expect(formattedRoles).to.eql(targetRoles);
    });
    describe("formatTitle", function() {
        var context = { model: { id: "exists", firstName: "Fred", lastName: "Flintstone" } };
        expect (fn.formatTitle(undefined, context) ).to.equal("Fred Flintstone");
        
        context = { model: { firstName: "Fred", lastName: "Flintstone" } };
        expect (fn.formatTitle(undefined, context) ).to.equal("New participant");
        
        context = { model: { id: "foo" } };
        expect (fn.formatTitle(undefined, context) ).to.equal("—");
    });
    describe("persistAttributes", function() {
        var attr = [
            {key: "foo", obs: ko.observable("1")},
            {key: "bar", obs: ko.observable("2")},
        ];
        expect( fn.persistAttributes(attr) ).to.deep.equal({foo:"1",bar:"2"});
    });
    describe("persistLanguages", function() {
        expect(fn.persistLanguages(" en, fr ")).to.eql(["en","fr"]);
        expect(fn.persistLanguages(" ")).to.be.empty;
    });
    describe("persistRoles", function() {
        var roles = ["Developer", "Researcher", "Administrator", "Test users", "Worker"];
        var targetRoles = ["developer","researcher", "admin", "test_users", "worker"];
        
        var formattedRoles = fn.persistRoles(roles);
        expect(formattedRoles).to.eql(targetRoles);
    });
    xdescribe("callObsCallback", function() {
        // TODO
    });
});