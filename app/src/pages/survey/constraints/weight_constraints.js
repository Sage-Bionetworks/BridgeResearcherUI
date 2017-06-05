var surveyUtils = require('../survey_utils');

module.exports = function(params) {
    var self = this;
    surveyUtils.initConstraintsVM(self, params);
    self.forInfantObs = self.element.constraints.forInfantObs;
};