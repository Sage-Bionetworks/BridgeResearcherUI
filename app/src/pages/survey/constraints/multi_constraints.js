var surveyUtils = require('../survey_utils');
var root = require('../../../root');

module.exports = function(params) {
    var self = this;

    surveyUtils.initConstraintsVM(self, params);
    self.collectionName = params.collectionName;
    self.allowOtherObs = self.element.constraints.allowOtherObs;
    self.allowMultipleObs = self.element.constraints.allowMultipleObs;
    self.enumerationObs = self.element.constraints.enumerationObs;
    self.dataTypeObs = self.element.constraints.dataTypeObs;

    self.editEnum = function() {
        root.openDialog('enumeration_editor', {parentViewModel: self, enumerationObs: self.enumerationObs});
    };
};