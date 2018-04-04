import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';

module.exports = function(params) {
    let self = this;

    let input = fn.seq(fn.asDate, fn.utcTolocalDateTime, ko.observable);
    self.startsOnObs = input(params.startsOnObs() || new Date());
    self.endsOnObs = input(params.endsOnObs() || new Date());
    self.formatDateTime = fn.formatDateTime;
    self.cancel = root.closeDialog;
    self.clear = fn.seq(params.clearWindowFunc, root.closeDialog);

    self.save = function() {
        let startsOnUTC = fn.localDateTimeToUTC(self.startsOnObs());
        let endsOnUTC = fn.localDateTimeToUTC(self.endsOnObs());
        params.startsOnObs(startsOnUTC);
        params.endsOnObs(endsOnUTC);
        root.closeDialog();
    };
    
};