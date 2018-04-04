import surveyUtils from '../survey_utils';
import fn from '../../../functions';

module.exports = function(params) {
    let self = this;
    surveyUtils.initConstraintsVM(self, params);
    fn.copyProps(self, self.element.constraints, 'minValueObs', 'maxValueObs', 'stepObs', 'unitObs');
    /*    
    self.minValueObs = self.element.constraints.minValueObs;
    self.maxValueObs = self.element.constraints.maxValueObs;
    self.stepObs = self.element.constraints.stepObs;
    self.unitObs = self.element.constraints.unitObs;
    */
};