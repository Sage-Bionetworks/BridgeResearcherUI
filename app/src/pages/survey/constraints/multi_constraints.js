var surveyUtils = require('../survey_utils');
var utils = require('../../../utils');

module.exports = function(params) {
    var self = this;

    surveyUtils.initConstraintsVM(self, params);
    self.allowOtherObs = self.element.constraints.allowOtherObs;
    self.allowMultipleObs = self.element.constraints.allowMultipleObs;
    self.enumerationObs = self.element.constraints.enumerationObs;

    self.editEnum = function() {
        utils.openDialog('enumeration', {parentViewModel: self, enumerationObs: self.enumerationObs});
    };
};