import surveyUtils from './survey_utils';

module.exports = function(params) {
    let self = this;
    self.collectionName = params.collectionName;
    surveyUtils.initConstraintsVM(self, params);
};