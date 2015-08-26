var surveyUtils = require('../survey_utils');
var utils = require('../../../utils');
var ko = require('knockout');

var fields = ['allowOther','allowMultiple','enumeration[]'];

module.exports = function(params) {
    var self = this;

    surveyUtils.initConstraintsVM(self, params);
    utils.observablesFor(self, fields, self.element.constraints);

    self.editEnum = function() {
        utils.openDialog('enumeration', {parentViewModel: self});
    };
};