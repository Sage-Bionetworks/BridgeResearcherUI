var schemaUtils = require('./schema_utils');

module.exports = function(params) {
    var self = this;

    self.itemsObs = params.itemsObs;
    self.publishedObs = params.publishedObs;
    self.index = params.index;

    self.clickHandler = function(vm, event) {
        var index = vm.index();
        var el = schemaUtils.newElement();
        self.itemsObs.splice(index+1,0,el);
    };
};