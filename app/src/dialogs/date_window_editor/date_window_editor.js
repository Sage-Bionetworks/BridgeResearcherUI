var ko = require('knockout');
var root = require('../../root');
var tx = require('../../transforms');
var fn = require('../../functions');

module.exports = function(params) {
    var self = this;

    var startsOnLocal = tx.utcTolocalDateTime(params.startsOnObs());
    var endsOnLocal = tx.utcTolocalDateTime(params.endsOnObs());
    self.startsOnObs = ko.observable(startsOnLocal);
    self.endsOnObs = ko.observable(endsOnLocal);
    self.formatDateTime = fn.formatDateTime;

    self.save = function() {
        var startsOnUTC = tx.localDateTimeToUTC(self.startsOnObs());
        var endsOnUTC = tx.localDateTimeToUTC(self.endsOnObs());
        params.startsOnObs(startsOnUTC);
        params.endsOnObs(endsOnUTC);
        root.closeDialog();
    };
    self.clear = function() {
        params.clearWindowFunc();
        root.closeDialog();
    };
    self.cancel = function() {
        root.closeDialog();
    };
};