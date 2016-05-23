var ko = require('knockout');

function nameInspector(string) {
    var isArray = /\[\]$/.test(string);
    var name = (isArray) ? string.match(/[^\[]*/)[0] : string;
    return {name: name, observableName: name+"Obs", isArray: isArray};
}
function identity(value) {
    return value;
}
function createObservable(doBinding) {
    return function(name, defaultValue, modelTransform, obsTransform) {
        var info = nameInspector(name);
        info.modelTransform = modelTransform || identity;
        info.obsTransform = obsTransform || identity; // not needed for an observer
        info.bind = doBinding;
        
        var value = (typeof defaultValue === "undefined") ? undefined : defaultValue;
        // Don't call the transform for the initial value. We have transforms that 
        // require study to be loaded and this is usually too early in the cycle for 
        // that to be true. Just init the value you want to see in the world.
        var obs = (info.isArray) ?
            ko.observableArray(value) :
            ko.observable(value);
        this.vm[info.observableName] = info.observable = obs;
        this.fields[info.name] = info;
        return this;
    }
}

function Binder(vm) {
    this.vm = vm;
    this.fields = {};
}
Binder.prototype = {
    /**
     * Create an observable on the view model that updates the model object.
     * Update will update the observable, and persist will update the model 
     * object.
     * 
     * @param name - the name of the property on the model object
     * @param defaultValue - a default value for this field, can null
     * @param modelTransform - a pure function that formats a model value before
     *      setting an observer with the value
     * @param obsTransform - a pure function that formats the value of an 
     *      observable before updating a model object
     */
    bind: createObservable(true),
    /**
     * Create an observable on the view model that does not update the model object.
     * Update will update the observable, but persist will not update the model 
     * object. An observer transform is not needed because the observer will not be 
     * used to update a model object.
     * 
     * @param name - the name of the property on the model object
     * @param defaultValue - a default value for this field, can null
     * @param modelTransform - a pure function that formats a model value before
     *      setting an observer with the value
     */
    obs: createObservable(false),
    /**
     * Returns a function that can receive a model update and update observables
     * in the view model. If no field names are supplied, all observables that have 
     * a name that matches a field of the model will be updated. Before being copied 
     * to an observable, the value is passed through the "toFormatter", which receives 
     * two arguments the value, and a context object with oldValue (the current 
     * value of the observable), model (the model), and vm (the viewModel).
     * @example
     *      serverService.getStudy().then(binder.update('title', 'version'));
     */
    update: function() {
        if (arguments.length > 0 && typeof arguments[0] !== 'string') {
            throw new Error("binder.update() returns function for updating, do not call directly with a model object.");
        }
        var fields = (arguments.length > 0) ? arguments : Object.keys(this.fields);
        return function(model) {
            for (var i=0; i < fields.length; i++) {
                var field = fields[i];
                var info = this.fields[field];
                var context = {oldValue: info.observable(), model: model, vm: this.vm, observer: info.observable};
                // This should obviate the need for fn.maintainValue so many places
                if (typeof model[field] !== "undefined") {
                    var value = info.modelTransform(model[field], context);
                    console.debug("Updating " + field + "Obs to", value);
                    info.observable(value);
                }
            };
            return model;
        }.bind(this);
    },
    /**
     * Persist all the bound observables (two-way data bound) back to a copy of the model
     * object, maintaining all the existing properties that are not update.
     * 
     * @param model - the model to serve as a basis for the updated model object. Each value 
     * from an observable is passed to the "fromFormatter" for processing, if it was defined. 
     * that receives two values: the value, and a context object with oldValue (the current 
     * value of that field on the model), model (the model), the vm (the viewModel), and the 
     * observer.
     */
    persist: function(model) {
        var copy = Object.assign({}, model);
        Object.keys(this.fields).forEach(function(field) {
            var info = this.fields[field];
            if (info.bind) {
                var context = {oldValue: model[info.name], model: model, vm: this.vm, observer: info.observable};
                var value = info.obsTransform(info.observable(), context);
                if (value != null && typeof value !== "undefined") {
                    console.debug("Updating model field to", info.name);
                    copy[info.name] = value;    
                } else {
                    console.debug("Removing model field ", info.name);
                    delete copy[info.name];
                }
            }
        }, this);
        return copy;
    },
    assign: function(field) {
        return function(model) {
            return this.vm[field] = model;
        }.bind(this);
    }
};

module.exports = function(vm) {
    return new Binder(vm);
};