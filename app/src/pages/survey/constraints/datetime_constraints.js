import { surveyUtils } from '../survey_utils';

module.exports = function(params) {
    var self = this;
    surveyUtils.initConstraintsVM(self, params);
    self.earliestValueObs = self.element.constraints.earliestValueObs;
    self.latestValueObs = self.element.constraints.latestValueObs;
    self.allowFutureObs = self.element.constraints.allowFutureObs;
};