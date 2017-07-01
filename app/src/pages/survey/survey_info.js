import { surveyUtils } from './survey_utils';

module.exports = function(params) {
    var self = this;
    self.collectionName = params.collectionName;
    surveyUtils.initConstraintsVM(self, params);
};