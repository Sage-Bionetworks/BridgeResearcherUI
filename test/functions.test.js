import * as fn from '../app/src/functions.js';
import { expect } from 'chai';
import * as sinon from 'sinon';

if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength,padString) {
        targetLength = targetLength>>0; //floor if number or convert non-number to 0;
        padString = String(padString || ' ');
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0,targetLength) + String(this);
        }
    };
}

// Note that date formatting functions are locale-sensitive and will fail on machines configured
// differently than in the United States.
var TIME = new Date(1495562263000);
function getArray() {
    return [{foo:"Dates"},{foo:"apples"},{foo:"carrots"},{foo:"Bananas"}];
}

describe("functions", function() {

describe("date & time formatting", function() {
    describe("formatDate", function() {
        it("formats date string", function() {
            expect(fn.formatDate(TIME.toString())).to.equal(TIME.toLocaleDateString());
            expect(fn.formatDate(TIME.toISOString())).to.equal(TIME.toLocaleDateString());
        });
        it ("formats date object", function() {
            expect(fn.formatDate(TIME)).to.equal(TIME.toLocaleDateString());
        });
        it ("handles malformed input", function() {
            expect(fn.formatDate("asdf")).to.equal("");
        });
    });
    describe("formatDateTime", function() {
        it("formats datetime string", function() {
            expect(fn.formatDateTime(TIME.toString())).to.equal(TIME.toLocaleString());
            expect(fn.formatDateTime(TIME.toISOString())).to.equal(TIME.toLocaleString());
        });
        it ("formats datetime object", function() {
            expect(fn.formatDateTime(TIME)).to.equal(TIME.toLocaleString());
        });
        it ("handles malformed input", function() {
            expect(fn.formatDateTime("asdf")).to.equal("");
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
    function pad(number, padding) {
        return (number+"").padStart(padding, "00000");
    }
    describe("localDateTimeToUTC", function() {
        it("converts our test time to UCT", function() {
            var utcValue = TIME.getFullYear() + "-" + pad(TIME.getMonth()+1,2) + 
                "-" + TIME.getDate() + "T" + pad(TIME.getHours(),2) + ":" + 
                TIME.getMinutes() + ":" + TIME.getSeconds() + "." + 
                pad(TIME.getMilliseconds(),3) + "Z";
            expect(fn.localDateTimeToUTC(TIME).toISOString())
                .to.equal(utcValue);
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
describe("updateObs", function() {
    it("works", function() {
        var observer = sinon.spy();
        var func = fn.handleObsUpdate(observer, 'name');
        var obj = {name:'foo'};
        var result = func(obj);

        expect(result).to.equal(obj);
        expect(observer.calledWith('foo')).to.be.true;
    });
});
describe("handleStaticObsUpdate", function() {
    it("works", function() {
        var observer = sinon.spy();
        var func = fn.handleStaticObsUpdate(observer, 10);
        var result = func('foo');
        
        expect(result).to.equal('foo');
        expect(observer.calledWith(10)).to.be.true;
    });
});
describe("handleForEach", function() {
    it("works", function() {
        var count = 0;
        var processor = function() {
            count++;
        }
        var func = fn.handleForEach('items', processor)
        var object = {items: ['a','b','c']};

        var result = func(object);
        expect(result).to.equal(object);
        expect(count).to.equal(3);
    });
});
describe("copyProps", function() {
    it("works", function() {
        var source = {prop1:10, prop2:false};
        var target = {};

        fn.copyProps(target, source, 'prop1', 'prop2');
        expect(target.prop1).to.equal(10);
        expect(target.prop2).to.equal(false);
    });
    it("renames variables", function() {
        var source = {prop1:10, prop2:false};
        var target = {};

        fn.copyProps(target, source, 'prop1->prop3', 'prop2->prop4');
        expect(target.prop3).to.equal(10);
        expect(target.prop4).to.equal(false);
    });
});
describe("returning", function() {
    it("works", function() {
        var obj = {};
        var func = fn.returning(obj);

        var result = func("Some other value");
        expect(result).to.equal(obj);
    });
});
describe("makeFieldSorter", function() {
    it("works", function() {
        var array = getArray();
        var sorter = fn.makeFieldSorter('foo');

        array.sort(sorter);
        expect(array[0].foo).to.equal("apples");
        expect(array[1].foo).to.equal("Bananas");
        expect(array[2].foo).to.equal("carrots");
        expect(array[3].foo).to.equal("Dates");
    });
    it("fails silently if field missing", function() {
        var array = getArray();
        var sorter = fn.makeFieldSorter('bar');

        array.sort(sorter);
        expect(array[0].foo).to.equal("Dates");
        expect(array[1].foo).to.equal("apples");
        expect(array[2].foo).to.equal("carrots");
        expect(array[3].foo).to.equal("Bananas");
    });
});
describe("lowerCaseStringSorter", function() {
    it("works", function() {
        var array = ["Dates","apples","carrots","Bananas"];
        array.sort(fn.lowerCaseStringSorter);
        expect(array).to.have.members(["apples","Bananas","carrots","Dates"]);
    });
});
describe("handleSort", function() {
    it("works", function() {
        var object = {items: getArray()};
        var func = fn.handleSort('items', 'foo');
        func(object);
        expect(object.items[0].foo).to.equal("apples");
        expect(object.items[1].foo).to.equal("Bananas");
        expect(object.items[2].foo).to.equal("carrots");
        expect(object.items[3].foo).to.equal("Dates");
    });
});
describe("handleMap", function() {
    it("works", function() {
        var mapper = function(item) {
            return "b";
        };
        var func = fn.handleMap('items', mapper);

        var object = {items: ["a","a","a"]};
        var result = func(object);
        expect(object.items[0]).to.equal("b");
        expect(object.items[1]).to.equal("b");
        expect(object.items[2]).to.equal("b");
    });
});
describe("handleIf", function() {
    it("passes over function when false", function() {
        var func = sinon.stub();
        var bound = fn.handleIf(false, func);

        bound();
        expect(func.called).to.be.false;
    });
    it("executes function and returns value when true", function() {
        var func = sinon.stub().returns(1);

        var bound = fn.handleIf(true, func);

        var result = bound(2);
        expect(func.called).to.be.true;
        expect(result).to.equal(2);
    });
    it("executes function and returns original argument when true", function() {
        var func = sinon.stub().returns(1);

        var bound = fn.handleIf(true, func, true);

        var result = bound(2);
        expect(func.called).to.be.true;
        expect(result).to.equal(1);
    });
});
describe("incrementNumber", function() {
    it("handles missing values", function() {
        expect(fn.incrementNumber()).to.be.undefined;
        expect(fn.incrementNumber(null)).to.be.null;
    });
    it("extracts and increments number at end", function() {
        expect(fn.incrementNumber("")).to.equal("1");
        expect(fn.incrementNumber("foo")).to.equal("foo1");
        expect(fn.incrementNumber("foo1")).to.equal("foo2");
    });
    it("is not confused by numbers elsewhere in string", function() {
        expect(fn.incrementNumber("12foo10")).to.equal("12foo11");
    });
});
describe("is", function() {
    it("handles null values", function() {
        expect(fn.is(null, 'Date')).to.be.false;
        expect(fn.is(undefined, 'Date')).to.be.false;
    });
    it("validates date", function() {
        expect(fn.is(new Date(), 'Date')).to.be.true;
        expect(fn.is('not a date', 'Date')).to.be.false;
    });
    it("validates regexp", function() {
        expect(fn.is(/a/, 'RegExp')).to.be.true;
        expect(fn.is('not a regex', 'RegExp')).to.be.false;
    });
    it("validates string", function() {
        expect(fn.is(new String('string'), 'String')).to.be.true;
        expect(fn.is('', 'String')).to.be.true;
        expect(fn.is(new Date, 'String')).to.be.false;
    });
    it("validates number", function() {
        expect(fn.is(new Number(4), 'Number')).to.be.true;
        expect(fn.is(-1, 'Number')).to.be.true;
        expect(fn.is('4', 'Number')).to.be.false;
    });
    it("validates array", function() {
        expect(fn.is(new Array(4), 'Array')).to.be.true;
        expect(fn.is([0], 'Array')).to.be.true;
        expect(fn.is('[]', 'Array')).to.be.false;
    });
    it("validates object", function() {
        expect(fn.is(new Object(), 'Object')).to.be.true;
        expect(fn.is({}, 'Object')).to.be.true;
        expect(fn.is(new Date(), 'Object')).to.be.false;
    });
    it("validates function", function() {
        expect(fn.is(new Function("x * x"), 'Function')).to.be.true;
        expect(fn.is(function() {}, 'Function')).to.be.true;
        expect(fn.is(new Date(), 'Function')).to.be.false;
    });
});
describe("isBlank", function() {
    it("detects blank, null, empty string", function() {
        expect(fn.isBlank()).to.be.true;
        expect(fn.isBlank(null)).to.be.true;
        expect(fn.isBlank("")).to.be.true;
        expect(fn.isBlank("   \t")).to.be.true;
    });
    it("does not report objects as blank", function() {
        expect(fn.isBlank(new Date())).to.be.false;
        expect(fn.isBlank({})).to.be.false;
        expect(fn.isBlank(function() {})).to.be.false;
    });
});
describe("deleteUnusedProperties", function() {
    it("deletes null, undefined, and empty strings (but not false)", function() {
        var object = {
            prop1: undefined,
            prop2: null,
            prop3: "",
            prop4: false
        };
        fn.deleteUnusedProperties(object);
        expect(Object.keys(object).length).to.equal(1);
        expect(object.prop4).to.be.false;
    });
});

});