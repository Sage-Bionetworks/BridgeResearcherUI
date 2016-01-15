var surveyUtils = require('./survey_utils');

module.exports = function(params) {
    var self = this;

    self.elementsObs = params.elementsObs;
    self.index = params.indexObs;

    self.clickHandler = function(type, index) {
        var el = surveyUtils.newField(type);
        self.elementsObs.splice(index+1,0,el);
    };
};