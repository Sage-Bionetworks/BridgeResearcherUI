import fn from '../../../functions';
import surveyUtils from '../survey_utils';

module.exports = function(params) {
    let self = this;
    surveyUtils.initConstraintsVM(self, params);
    fn.copyProps(self, self.element.constraints, 'earliestValueObs', 'latestValueObs', 'allowFutureObs');
    /*
    self.earliestValueObs = self.element.constraints.earliestValueObs;
    self.latestValueObs = self.element.constraints.latestValueObs;
    self.allowFutureObs = self.element.constraints.allowFutureObs;
    */
};