import { Binder } from '../app/src/binder.js';
import * as ko from 'knockout';
import { expect } from 'chai';
import * as sinon from 'sinon';

describe("binder", function() {
    function multiply(value) {
        return value * 2;
    }
    function bang(value) {
        return value + "!"
    }
    it("can instantiate a binder object", function() {
        var vm = {};
        var binder = new Binder(vm);
        expect(binder).to.not.be.null;
        expect(binder.vm).to.equal(vm); 
    });
    it("obs() with name only", function() {
        var vm = {};
        var binder = new Binder(vm);
        
        binder.obs('any')
            .obs('array[]');
            
        expect(vm.anyObs).to.be.instanceof(Function);
        expect(vm.arrayObs).to.be.instanceof(Function);
        expect(vm.arrayObs.push).to.not.be.undefined;
        
        vm.anyObs("test");
        expect(vm.anyObs()).to.equal("test");
    });
    it("obs() with default values", function() {
        var vm = {};
        var binder = new Binder(vm);
        binder.obs('fieldOne', false);
        binder.obs('fieldTwo', 0);
        binder.obs('fieldThree', null);
        binder.obs('fieldFour', undefined);

        expect(vm.fieldOneObs()).to.equal(false);
        expect(vm.fieldTwoObs()).to.equal(0);
        expect(vm.fieldThreeObs()).to.equal(null);
        expect(vm.fieldFourObs()).to.equal(undefined);
    });
    it("obs() with observer transform doesn't apply transform to default value", function() {
        var vm = {};
        var binder = new Binder(vm);
        binder.obs("any", 2, multiply);
        
        expect(vm.anyObs()).to.equal(2);
    });
    it("obs() with observer transform applies transform on model-based update", function() {
        var vm = {};
        var binder = new Binder(vm);
        binder.obs("any", 2, multiply);
        
        binder.update()({any: 4});
        expect(vm.anyObs()).to.equal(8);
    });
    it("obs() without transform does not update model", function() {
        var vm = {};
        var binder = new Binder(vm);
        binder.obs("any", 2);
        
        var result = binder.persist({});
        expect(result.any).to.be.undefined;
    });
    it("obs() with model transform does not update model", function() {
        var vm = {};
        var binder = new Binder(vm);
        binder.obs("any", 2, multiply, bang);
        
        var result = binder.persist({});
        expect(result.any).to.be.undefined;
    });
    
    
     it("bind() with observer transform doesn't apply transform to default value", function() {
        var vm = {};
        var binder = new Binder(vm);
        binder.bind("any", 2, multiply);
        
        expect(vm.anyObs()).to.equal(2);
    });
    it("bind() with observer transform applies transform on model-based update", function() {
        var vm = {};
        var binder = new Binder(vm);
        binder.bind("any", 2, multiply);
        
        binder.update()({any: 4});
        expect(vm.anyObs()).to.equal(8);
    });
    it("obs() without transform updates model", function() {
        var vm = {};
        var binder = new Binder(vm);
        binder.bind("any", 2);
        
        var result = binder.persist({});
        expect(result.any).to.equal(2);
    });
    it("bind() with model transform updates model", function() {
        var vm = {};
        var binder = new Binder(vm);
        binder.bind("any", 2, multiply, bang);
        
        var result = binder.persist({});
        expect(result.any).to.equal("2!");
    });   
    it("bind() with both transforms works", function() {
        var vm = {};
        var binder = new Binder(vm);
        binder.bind("any", 2, multiply, bang);
        binder.update()({'any':4})
        
        var result = binder.persist({});
        expect(result.any).to.equal("8!");
    });   
    it("mixes obs() and bind() correctly", function() {
        var vm = {};
        var binder = new Binder(vm);
        
        binder.obs('fieldOne', 1)
        binder.bind('fieldTwo', 2);
        vm.fieldOneObs(10);
        vm.fieldTwoObs(20);
        
        var results = binder.persist({});
        expect(results.fieldOne).to.be.undefined;
        expect(results.fieldTwo).to.equal(20);
        
    });
    it("provides a context on processing value to observable", function() {
        var vm = {};
        var binder = new Binder(vm);
        var model = {any: 4};
        var updateModel = {any: 3};
        var obsTransformContext = null;
        var modelTransformContext = null;
        
        binder.bind('any', 2, function(value, context) {
            obsTransformContext = context;
        }, function(value, context) {
            modelTransformContext = context;
        });
        binder.update()(model);
        binder.persist(updateModel);
        
        expect(obsTransformContext).to.not.be.null;
        expect(obsTransformContext.oldValue).to.equal(2);
        expect(obsTransformContext.model).to.equal(model);
        expect(obsTransformContext.vm).to.equal(binder.vm);
        expect(obsTransformContext.observer).to.be.instanceof(Function);
        
        expect(modelTransformContext).to.not.be.null;
        expect(modelTransformContext.oldValue).to.equal(3);
        expect(modelTransformContext.model).to.equal(updateModel);
        expect(modelTransformContext.vm).to.equal(binder.vm);
        expect(modelTransformContext.observer).to.be.instanceof(Function);
    });
});
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
            var result = Binder.formatAttributes({
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
            expect(Binder.formatHealthCode("ABC", context) ).to.equal("N/A");
            
            context = { vm: { study: { healthCodeExportEnabled: true } } };
            expect(Binder.formatHealthCode("ABC", context) ).to.equal("ABC");
        });
    });
    describe("formatTitle", function() {
        it("works", function() {
            var context = { model: { id: "exists", firstName: "Fred", lastName: "Flintstone" } };
            expect(Binder.formatTitle(undefined, context) ).to.equal("Fred Flintstone");

            context = { model: { firstName: "Fred", lastName: "Flintstone" } };
            expect(Binder.formatTitle(undefined, context) ).to.equal("Fred Flintstone");
            
            context = { model: { firstName: "Fred" } };
            expect(Binder.formatTitle(undefined, context) ).to.equal("Fred");
            
            context = { model: { id: "foo", email: "email@email.com" } };
            expect(Binder.formatTitle(undefined, context) ).to.equal("email@email.com");

            context = { model: { id: "new" } };
            expect(Binder.formatTitle(undefined, context) ).to.equal("New participant");
            
            context = { model: { id: "foo" } };
            expect(Binder.formatTitle(undefined, context) ).to.equal("—");

            context = { model: { id: "new", firstName: "Fred" } };
            expect(Binder.formatTitle(undefined, context) ).to.equal("Fred");

            context = { model: { id: "new", firstName: "Fred", lastName: "Flintstone" } };
            expect(Binder.formatTitle(undefined, context) ).to.equal("Fred Flintstone");
        });
    });
    describe("persistAttributes", function() {
        it("works", function() {
            var attr = [
                {key: "foo", obs: ko.observable("1")},
                {key: "bar", obs: ko.observable("2")},
            ];
            expect(Binder.persistAttributes(attr)).to.deep.equal({foo:"1",bar:"2"});
        });
    });
});