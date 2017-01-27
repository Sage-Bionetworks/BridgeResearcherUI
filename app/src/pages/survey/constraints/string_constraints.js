var surveyUtils = require('../survey_utils');

module.exports = function(params) {
    var self = this;
    surveyUtils.initConstraintsVM(self, params);
    ['minLengthObs','maxLengthObs','patternObs','patternPlaceholderObs','patternErrorMessageObs'].forEach(function(field) {
        self[field] = self.element.constraints[field];
    });
};