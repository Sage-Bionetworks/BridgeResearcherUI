import surveyUtils from '../survey_utils';

module.exports = function(params) {
    var self = this;

    surveyUtils.initConstraintsVM(self, params);
    self.minValueObs = self.element.constraints.minValueObs;
    self.maxValueObs = self.element.constraints.maxValueObs;
    self.stepObs = self.element.constraints.stepObs;
    self.unitObs = self.element.constraints.unitObs;

};