var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');

module.exports = function(params) {
    var self = this;
    
    self.identifierObs = ko.observable();

    self.close = function() {
        root.closeDialog();
    }
    self.create = function(vm, event) {
        var nextId = self.identifierObs();
        if (!utils.isNotBlank(nextId)) {
            utils.failureHandler()(new Error("You must enter an ID."));
            return;
        }
        params.vm.createFromNew(nextId);
        root.closeDialog();
    }
    
}