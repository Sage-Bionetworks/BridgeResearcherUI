var expect = require('chai').expect;
var fn = require('../app/src/functions');

// Note that date formatting functions are locale-sensitive and will fail on machines configured
// differently than in the United States.
var TIME = new Date(1495562263000); // Tue May 23 2017 10:57:43 GMT-0700 (PDT)

describe("functions", function() {

describe("date & time formatting", function() {
    describe("formatDate", function() {
        it("formats date string", function() {
            expect(fn.formatDate(TIME.toString())).to.equal("5/23/2017");
            expect(fn.formatDate(TIME.toISOString())).to.equal("5/23/2017");
        });
        it ("formats date object", function() {
            expect(fn.formatDate(TIME)).to.equal("5/23/2017");
        });
        it ("handles malformed input", function() {
            expect(fn.formatDate("asdf")).to.equal("");
        });
    });
    describe("formatDateTime", function() {
        it("formats datetime string", function() {
            expect(fn.formatDateTime(TIME.toString())).to.equal("5/23/2017, 10:57:43 AM");
            expect(fn.formatDateTime(TIME.toISOString())).to.equal("5/23/2017, 10:57:43 AM");
        });
        it ("formats datetime object", function() {
            expect(fn.formatDateTime(TIME)).to.equal("5/23/2017, 10:57:43 AM");
        });
        it ("handles malformed input", function() {
            expect(fn.formatDateTime("asdf")).to.equal("");
        });
        it ("handles null input", function() {
            expect(function(){
                fn.formatDateTime(null);
            }).to.throw();
        });
    });
    describe("formatMs", function() {
        it("formats long milliseconds", function() {
            expect(fn.formatMs(12390876)).to.equal("3h 26m 30s");
        });
        it("formats 0", function() {
            expect(fn.formatMs(0)).to.equal("0s");
        });
        it("handles malformed input", function() { 
            expect(function(){
                expect(fn.formatMs("asdf"));
            }).to.throw();
        });
        it("handles null input", function() { 
            expect(function(){
                fn.formatMs(null);
            }).to.throw();
        });
    });
    describe("localDateTimeToUTC", function() {
        it("converts our test time to UCT", function() {
            expect(fn.localDateTimeToUTC(TIME).toISOString())
                .to.equal("2017-05-23T10:57:43.000Z");
        });
    });
});
describe("formatTitleCase", function() {
    it("deals with empty values", function() {
        expect(fn.formatTitleCase()).to.equal("");
        expect(fn.formatTitleCase(null)).to.equal("");
        expect(fn.formatTitleCase("")).to.equal("");
        expect(fn.formatTitleCase(" ")).to.equal(" "); 
    });
    it("formats snake case", function() {
        expect(fn.formatTitleCase("one_funny_snake")).to.equal("One funny snake");
    });
    it("formats camel case", function() {
        expect(fn.formatTitleCase("oneFunnySnake")).to.equal("One funny snake");
    });
});
describe("queryString", function() {
    it("converts to queryString", function() {
        expect(fn.queryString({})).to.equal("");
        expect(fn.queryString(null)).to.equal("");
        expect(fn.queryString({"foo":true})).to.equal("?foo=true");
        expect(fn.queryString({"foo":true,bar:null})).to.equal("?foo=true");
        expect(fn.queryString({"foo":true,bar:10})).to.equal("?foo=true&bar=10");
    });
});
describe("formatVersionRange", function() {
    it("formats range", function() {
        expect( fn.formatVersionRange(0,10) ).to.equal("0-10");
        expect( fn.formatVersionRange(null,8) ).to.equal("0-8");
        expect( fn.formatVersionRange(2) ).to.equal("2+");
        expect( fn.formatVersionRange() ).to.equal("<i>All versions</i>");
    });
});
describe("langauges", function() {
    describe("formatLanguages", function() {
        it("works", function() {
            expect( fn.formatLanguages(["en","fr"]) ).to.eql("en, fr");
            expect( fn.formatLanguages(undefined) ).to.equal("");
            expect( fn.formatLanguages(null) ).to.equal("");
            expect( fn.formatLanguages([]) ).to.equal("");
        });
    });
    describe("persistLanguages", function() {
        it("works", function() {
            expect(fn.persistLanguages(" en, fr ")).to.eql(["en","fr"]);
            expect(fn.persistLanguages(" ")).to.be.empty;
        });
    });
});
describe("roles", function() {
    describe("formatRoles", function() {
        it("works", function() {
            var roles = ["developer","researcher", "admin", "test_users", "worker"];
            var targetRoles = ["Developer", "Researcher", "Administrator", "Test users", "Worker"];
            
            var formattedRoles = fn.formatRoles(roles);
            expect(formattedRoles).to.eql(targetRoles);
        });
    });
    describe("persistRoles", function() {
        it("works", function() {
            var roles = ["Developer", "Researcher", "Administrator", "Test users", "Worker"];
            var targetRoles = ["developer","researcher", "admin", "test_users", "worker"];
            
            var formattedRoles = fn.persistRoles(roles);
            expect(formattedRoles).to.eql(targetRoles);
        });
    });
});
describe("formatName", function() {
    it("formats name", function() {
        expect(fn.formatName({firstName:"First",lastName:"Last"}) ).to.equal("First Last");
    });
    it("formats name with <EMPTY> values", function() {
        expect(fn.formatName({firstName:"<EMPTY>",lastName:"<EMPTY>"})).to.equal("—");
        expect(fn.formatName({firstName:"<EMPTY>",lastName:"Last"})).to.equal("Last");
        expect(fn.formatName({firstName:"First",lastName:"<EMPTY>"})).to.equal("First");
    });
    it("formats name with missing properties", function() {
        expect(fn.formatName({firstName:"First"})).to.equal("First");
        expect(fn.formatName({lastName:"Last"})).to.equal("Last");
        expect(fn.formatName({})).to.equal("—");
        expect(fn.formatName()).to.equal("—");
    });
});
describe("dateTimeString", function() {
    it("safely converts date without nulls", function() {
        expect(fn.dateTimeString(null)).to.be.null;
    });
    it("safely converts date without nulls", function() {
        expect(fn.dateTimeString(TIME)).to.equal(TIME.toISOString());
    });
});

});