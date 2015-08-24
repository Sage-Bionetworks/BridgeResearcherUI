var surveyUtils = require('../survey_utils');
var ko = require('knockout');

module.exports = function(params) {
    var self = this;
    surveyUtils.initConstraintsVM(self, params);

    self.earliestValueObs = ko.observable(self.element.constraints.earliestValue);
    self.latestValueObs = ko.observable(self.element.constraints.latestValue);
    self.allowFutureObs = ko.observable(self.element.constraints.allowFuture);
};