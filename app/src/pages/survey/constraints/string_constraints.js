var surveyUtils = require('../survey_utils');
var utils = require('../../../utils');

var fields = ["minLength", "maxLength", "pattern"];

module.exports = function(params) {
    var self = this;
    surveyUtils.initConstraintsVM(self, params);
    utils.observablesFor(self, fields, self.element.constraints);
};