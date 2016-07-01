var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');

module.exports = function(params) {
    var self = this;

    self.reasonObs = ko.observable();
    self.cancel = root.closeDialog;

    self.withdraw = function(vm, event) {
        utils.startHandler(vm, event);
        params.vm.finishWithdrawal(self.reasonObs());
    };
};
