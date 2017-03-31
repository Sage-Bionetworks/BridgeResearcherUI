var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');

/**
 *  userId, vm, closeMethod, subpopGuid
 */
module.exports = function(params) {
    var self = this;

    self.reasonObs = ko.observable();
    self.cancel = root.closeDialog;
    self.title = (params.subpopGuid) ? "Withdraw from consent group" : "Withdraw user from study";

    self.withdraw = function(vm, event) {
        utils.startHandler(vm, event);
        params.vm[params.closeMethod](self.reasonObs(), params.subpopGuid);
    };
};
