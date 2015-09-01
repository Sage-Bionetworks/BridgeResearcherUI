var surveyUtils = require('../survey_utils');
var utils = require('../../../utils');

module.exports = function(params) {
    var self = this;
    surveyUtils.initConstraintsVM(self, params);
    self.minValueObs = params.elements.constraints.minValueObs;
    self.maxValueObs = params.elements.constraints.maxValueObs;
    self.stepObs = params.elements.constraints.stepObs;
    self.unitObs = params.elements.constraints.unitObs;
};