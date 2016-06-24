var ko = require('knockout');
var serverService = require('../../services/server_service');
var root = require('../../root');

module.exports = function(params) {
    var self = this;

    self.reasonObs = ko.observable();

    self.cancel = root.closeDialog;

    self.withdraw = function(vm, event) {
        params.vm.finishWithdrawal(self.reasonObs());
    };
};
