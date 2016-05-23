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