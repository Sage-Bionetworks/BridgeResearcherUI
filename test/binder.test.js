var expect = require('chai').expect;
var bind = require('../app/src/binder');

describe("binder", function() {
    function multiply(value) {
        return value * 2;
    }
    function bang(value) {
        return value + "!"
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
        
        binder.obs('any')
            .obs('array[]');
            
        expect(vm.anyObs).to.be.instanceof(Function);
        expect(vm.arrayObs).to.be.instanceof(Function);
        expect(vm.arrayObs.push).to.be.defined;
        
        vm.anyObs("test");
        expect(vm.anyObs()).to.equal("test");
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
    it("obs() with observer transform doesn't apply transform to default value", function() {
        var vm = {};
        var binder = bind(vm);
        binder.obs("any", 2, multiply);
        
        expect(vm.anyObs()).to.equal(2);
    });
    it("obs() with observer transform applies transform on model-based update", function() {
        var vm = {};
        var binder = bind(vm);
        binder.obs("any", 2, multiply);
        
        binder.update()({any: 4});
        expect(vm.anyObs()).to.equal(8);
    });
    it("obs() without transform does not update model", function() {
        var vm = {};
        var binder = bind(vm);
        binder.obs("any", 2);
        
        var result = binder.persist({});
        expect(result.any).to.be.undefined;
    });
    it("obs() with model transform does not update model", function() {
        var vm = {};
        var binder = bind(vm);
        binder.obs("any", 2, multiply, bang);
        
        var result = binder.persist({});
        expect(result.any).to.be.undefined;
    });
    
    
     it("bind() with observer transform doesn't apply transform to default value", function() {
        var vm = {};
        var binder = bind(vm);
        binder.bind("any", 2, multiply);
        
        expect(vm.anyObs()).to.equal(2);
    });
    it("bind() with observer transform applies transform on model-based update", function() {
        var vm = {};
        var binder = bind(vm);
        binder.bind("any", 2, multiply);
        
        binder.update()({any: 4});
        expect(vm.anyObs()).to.equal(8);
    });
    it("obs() without transform updates model", function() {
        var vm = {};
        var binder = bind(vm);
        binder.bind("any", 2);
        
        var result = binder.persist({});
        expect(result.any).to.equal(2);
    });
    it("bind() with model transform updates model", function() {
        var vm = {};
        var binder = bind(vm);
        binder.bind("any", 2, multiply, bang);
        
        var result = binder.persist({});
        expect(result.any).to.equal("2!");
    });   
    it("bind() with both transforms works", function() {
        var vm = {};
        var binder = bind(vm);
        binder.bind("any", 2, multiply, bang);
        binder.update()({'any':4})
        
        var result = binder.persist({});
        expect(result.any).to.equal("8!");
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
        var vm = {};
        var binder = bind(vm);
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