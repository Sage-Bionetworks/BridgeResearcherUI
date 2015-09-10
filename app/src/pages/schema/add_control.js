var schemaUtils = require('./schema_utils');
var ko = require('knockout');

module.exports = function(params) {
    var self = this;

    self.itemsObs = params.itemsObs;
    self.publishedObs = params.publishedObs;
    self.index = params.index;

    self.clickHandler = function(vm, event) {
        var index = ko.unwrap(vm.index);
        var field = schemaUtils.newField();
        self.itemsObs.splice(index+1,0,field);
    };
};