var ko = require('knockout');
var utils = require('../../utils');
var root = require('../../root');
var fn = require('../../transforms');

function getDate(observer) {
    if (observer()) {
        return observer().replace("Z","");
    }
    return '';
}

module.exports = function(params) {
    var self = this;

    self.startsOnObs = ko.observable(getDate(params.startsOnObs));
    self.endsOnObs = ko.observable(getDate(params.endsOnObs));
    self.formatDateTime = fn.formatLocalDateTime;

    self.save = function() {
        params.startsOnObs(self.startsOnObs());
        params.endsOnObs(self.endsOnObs());
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