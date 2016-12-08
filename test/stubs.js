var service = require('../app/src/services/server_service');
var sinon = require('sinon');
var rewire = require('rewire');

// stub out the entire service.
var serverService = Object.keys(service).reduce(function(obj, key) {
    obj[key] = sinon.stub();
    return obj;
}, {});
// Stupid helper method to return a value from one of the stubs.
serverService.doReturn = function(methodName, value) {
    serverService[methodName].returns(new Promise(value));
    return serverService;
}

// Don't use implementation that is asynchronous (Bluebird)
function Promise(value) {
    this.value = value;
    this.exception = null;
}
Promise.prototype = {
    then: function(func) {
        try {
            return new Promise(func(this.value));
        } catch(e) {
            this.exception = e; 
            return this;
        }
    },
    catch: function(func) {
        if (this.exception) {
            func(this.exception);
        }
    }
}
Promise.each = function(array, func) {
    array.map(func);
    return new Promise();
}
Promise.map = function(array, func) {
    array.map(func);
    return new Promise();
}

// Don't pause to prompt user for input, just execute confirmation function.
var alerts = {
    confirmation: function(message, func) {
        func();
    },
    deleteConfirmation: function(message, func, deleteButton) {
        func();
    }
};

// Tables reference alerts, so we will need to stub that part out frequently.
var tables = rewire('../app/src/tables');
tables.__set__('alerts', alerts);
tables.__set__('Promise', Promise);

module.exports = {
    serverService: serverService,
    Promise: Promise,
    alerts: alerts,
    tables: tables
};
