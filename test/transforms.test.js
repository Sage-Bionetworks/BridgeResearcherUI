var expect = require('chai').expect;
var tx = require('../app/src/transforms');
var ko = require('knockout');

describe("transforms", function() {
    describe("formatAttributes", function() {
        it("works", function() {
            var context = {
                vm: {
                    attributesObs: ko.observable([
                        {key:"foo", obs: ko.observable()},
                        {key:"bar", obs: ko.observable()}
                    ])
                }
            }
            var result = tx.formatAttributes({
                "foo":"1","bar":"2"
            }, context);
            expect(result[0].key).to.equal("foo");
            expect(result[0].obs()).to.equal("1");
            expect(result[1].key).to.equal("bar");
            expect(result[1].obs()).to.equal("2");
        });
    });
    describe("formatHealthCode", function() {
        it("works", function() {
            var context = { vm: { study: { healthCodeExportEnabled: false } } };
            expect( tx.formatHealthCode("ABC", context) ).to.equal("N/A");
            
            context = { vm: { study: { healthCodeExportEnabled: true } } };
            expect( tx.formatHealthCode("ABC", context) ).to.equal("ABC");
        });
    });
    describe("formatTitle", function() {
        it("works", function() {
            var context = { model: { id: "exists", firstName: "Fred", lastName: "Flintstone" } };
            expect (tx.formatTitle(undefined, context) ).to.equal("Fred Flintstone");

            context = { model: { firstName: "Fred", lastName: "Flintstone" } };
            expect (tx.formatTitle(undefined, context) ).to.equal("Fred Flintstone");
            
            context = { model: { firstName: "Fred" } };
            expect (tx.formatTitle(undefined, context) ).to.equal("Fred");
            
            context = { model: { id: "foo", email: "email@email.com" } };
            expect (tx.formatTitle(undefined, context) ).to.equal("email@email.com");

            context = { model: { id: "new" } };
            expect (tx.formatTitle(undefined, context) ).to.equal("New participant");
            
            context = { model: { id: "foo" } };
            expect (tx.formatTitle(undefined, context) ).to.equal("—");

            context = { model: { id: "new", firstName: "Fred" } };
            expect (tx.formatTitle(undefined, context) ).to.equal("Fred");

            context = { model: { id: "new", firstName: "Fred", lastName: "Flintstone" } };
            expect (tx.formatTitle(undefined, context) ).to.equal("Fred Flintstone");
        });
    });
    describe("persistAttributes", function() {
        it("works", function() {
            var attr = [
                {key: "foo", obs: ko.observable("1")},
                {key: "bar", obs: ko.observable("2")},
            ];
            expect( tx.persistAttributes(attr) ).to.deep.equal({foo:"1",bar:"2"});
        });
    });
});