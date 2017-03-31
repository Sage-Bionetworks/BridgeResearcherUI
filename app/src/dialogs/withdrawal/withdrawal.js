var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');

module.exports = function(params /*userId, vm, closeMethod, subpopGuid */) {
    var self = this;

    self.reasonObs = ko.observable();
    self.cancel = root.closeDialog;
    self.title = (params.subpopGuid) ? "Withdraw from consent group" : "Withdraw user from study";

    self.withdraw = function(vm, event) {
        utils.startHandler(vm, event);
        params.vm[params.closeMethod](self.reasonObs(), params.subpopGuid);
    };
};
