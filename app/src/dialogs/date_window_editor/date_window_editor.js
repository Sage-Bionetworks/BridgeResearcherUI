var ko = require('knockout');
var utils = require('../../utils');
var root = require('../../root');

module.exports = function(params) {
    var self = this;

    self.publishedObs = ko.observable(false);
    self.startsOnObs = ko.observable(params.startsOnObs());
    self.endsOnObs = ko.observable(params.endsOnObs());
    self.formatDateTime = utils.formatDateTime;

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
}