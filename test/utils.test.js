var expect = require('chai').expect;
var utils = require('../app/src/utils');

describe("utils", function() {
    describe("formatISODate", function() {
        var dateRegExp = /\d{4}-\d{2}-\d{2}/;
        it("formats date", function() {
            expect( utils.formatISODate() ).to.match(dateRegExp);
        });
        it("formats provided date", function() {
            expect( utils.formatISODate(new Date()) ).to.match(dateRegExp);
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
    describe("atLeastOneSignedConsent", function() {
        var activeConsent = {
            "subpopulationGuid": "api",
            "consentCreatedOn": "2016-05-20T22:27:46.310Z",
            "name": "A User",
            "birthdate": "1980-05-12",
            "signedOn": "2016-05-20T22:27:46.310Z",
            "hasSignedActiveConsent": true
        };
        var withdrawnConsent = {
            "subpopulationGuid": "test",
            "consentCreatedOn": "2016-05-20T22:27:46.310Z",
            "name": "A User",
            "birthdate": "1980-05-12",
            "signedOn": "2016-05-20T22:27:46.310Z",
            "withdrewOn": "2016-05-20T22:27:46.310Z",
            "hasSignedActiveConsent": true
        };
        
        it("allows when study has no consents" , function() {
            expect( utils.atLeastOneSignedConsent({}) ).to.be.true;
        });
        it("allows when user has not answered consents", function() {
            var ch = {"api": [], "api2": []};
            expect( utils.atLeastOneSignedConsent(ch) ).to.be.true;
        });
        it("allows when user has consented", function() {
            var ch = {"api": [activeConsent]};
            expect( utils.atLeastOneSignedConsent(ch) ).to.be.true;
        });
        it("does not allow when user has withdrawn", function() {
            var ch = {"test": [withdrawnConsent]};
            expect( utils.atLeastOneSignedConsent(ch) ).to.be.false;
        });
        it("allows when user has at least one active consent", function() {
            var ch = {
                "api": [activeConsent],
                "test": [withdrawnConsent]
            };
            expect( utils.atLeastOneSignedConsent(ch) ).to.be.true;
        });
    });
});