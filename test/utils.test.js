//import { utils } from '../app/src/utils';

// Doesn't work, because utils now depends on browser
xdescribe("utils", function() {
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