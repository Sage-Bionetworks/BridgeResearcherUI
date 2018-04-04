import surveyUtils from '../survey_utils';

module.exports = function(params) {
    let self = this;
    surveyUtils.initConstraintsVM(self, params);
    self.forInfantObs = self.element.constraints.forInfantObs;
};