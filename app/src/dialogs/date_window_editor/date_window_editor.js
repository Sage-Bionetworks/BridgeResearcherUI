import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';

module.exports = function(params) {
    let self = this;

    self.startsOnObs = ko.observable(params.startsOnObs() || new Date());
    self.endsOnObs = ko.observable(params.endsOnObs() || new Date());
    self.formatDateTime = fn.formatDateTime;
    self.cancel = root.closeDialog;
    self.clear = fn.seq(params.clearWindowFunc, root.closeDialog);

    self.save = function() {
        params.startsOnObs(self.startsOnObs());
        params.endsOnObs(self.endsOnObs());
        root.closeDialog();
    };
};