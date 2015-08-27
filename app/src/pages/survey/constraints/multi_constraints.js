var surveyUtils = require('../survey_utils');
var utils = require('../../../utils');
var ko = require('knockout');

var fields = ['allowOther','allowMultiple'];

module.exports = function(params) {
    var self = this;

    surveyUtils.initConstraintsVM(self, params);
    // This will not copy over the existing enumerationObs, it will look for
    // self.element.constraints.enumeration.
    utils.observablesFor(self, fields, self.element.constraints);
    self.enumerationObs = self.element.constraints.enumerationObs;

    self.editEnum = function() {
        utils.openDialog('enumeration', {parentViewModel: self, enumerationObs: self.enumerationObs});
    };
};