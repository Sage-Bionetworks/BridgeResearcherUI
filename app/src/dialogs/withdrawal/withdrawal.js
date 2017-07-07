import ko from 'knockout';
import root from '../../root';
import utils from '../../utils';

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
