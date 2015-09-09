var ko = require('knockout');
var surveyUtils = require('./survey_utils');

module.exports = function(params) {
    var self = this;

    self.elementsObs = params.elementsObs;
    self.publishedObs = params.publishedObs;
    self.index = params.indexObs;

    self.clickHandler = function(type, index) {
        var el = surveyUtils.newElement(type);
        self.elementsObs.splice(index+1,0,el);
    };
};