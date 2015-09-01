var surveyUtils = require('../survey_utils');

module.exports = function(params) {
    var self = this;
    surveyUtils.initConstraintsVM(self, params);
    self.minLengthObs = self.element.constraints.minLengthObs;
    self.maxLengthObs = self.element.constraints.maxLengthObs;
    self.patternObs = self.element.constraints.patternObs;
};