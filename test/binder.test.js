var expect = require('chai').expect;
var bind = require('../app/src/binder');

describe("binder", function() {
    function multiply(value) {
        return (value == null || typeof value === "undefined") ? 100 : (value * 2);
    }
    function bang(value) {
        return (value == null || typeof value === "undefined") ? "" : value + "!";
    }
    
    it("can instantiate a binder object", function() {
        var vm = {};
        var binder = bind(vm);
        expect(binder).to.not.be.null;
        expect(binder.vm).to.equal(vm); 
    });
    it("obs() with name only", function() {
        var vm = {};
        var binder = bind(vm);
        
        binder.obs('field1')
            .obs('field2')
            .obs('field3[]');
            
        expect(vm.field1Obs).to.be.instanceof(Function);
        expect(vm.field2Obs).to.be.instanceof(Function);
        expect(vm.field3Obs).to.be.instanceof(Function);
        expect(vm.field3Obs.push).to.be.defined;
        
        vm.field1Obs("test");
        expect(vm.field1Obs()).to.equal("test");
    });
    it("obs() with default values", function() {
        var vm = {};
        var binder = bind(vm);
        binder.obs('fieldOne', false);
        binder.obs('fieldTwo', 0);
        binder.obs('fieldThree', null);
        binder.obs('fieldFour', undefined);
        
        expect(vm.fieldOneObs()).to.equal(false);
        expect(vm.fieldTwoObs()).to.equal(0);
        expect(vm.fieldThreeObs()).to.equal(null);
        expect(vm.fieldFourObs()).to.equal(undefined);
    });
    it("obs() with formatted values", function() {
        // TODO: This is now testing bind, and the fact that init values are not
        // formatted before they are used. Break up into separate tests.
        var vm = {fieldThree: "somevalue"};
        var binder = bind(vm);
        binder.bind('fieldOne', 2, multiply);
        binder.bind('fieldTwo');
        
        // Initial values are not formatted:
        expect(vm.fieldOneObs()).to.equal(2);
        expect(vm.fieldTwoObs()).to.be.undefined;
        expect(vm.fieldThree).to.equal("somevalue");
        
        // Now update from a model. If the model does not have a field and no formatter
        binder.update()({fieldOne: 4});
        var obj = binder.persist({});
        expect(obj.fieldOne).to.equal(8);
        expect(obj.fieldTwo).to.be.undefined;
    });
    it("obs() does not update model", function() {
        var vm = {};
        var binder = bind(vm);
         
        binder.obs('fieldOne', 2);
        binder.obs('fieldTwo', 3);
        
        var results = binder.persist({fieldOne: 10, fieldTwo: 20});
        expect(results.fieldOne).to.equal(10);
        expect(results.fieldTwo).to.equal(20);
    });
    it("bind() updates model with a formatted value", function() {
        var vm = {};
        var binder = bind(vm);
        
        binder.bind('fieldOne', 2, null, bang);
        
        var results = binder.persist({});
        expect(results.fieldOne).to.equal("2!");
    });
    it("mixes obs() and bind() correctly", function() {
        var vm = {};
        var binder = bind(vm);
        
        binder.obs('fieldOne', 1)
        binder.bind('fieldTwo', 2);
        vm.fieldOneObs(10);
        vm.fieldTwoObs(20);
        
        var results = binder.persist({});
        expect(results.fieldOne).to.be.undefined;
        expect(results.fieldTwo).to.equal(20);
        
    });
    it("provides a context on processing value to observable", function() {
        
    });
});