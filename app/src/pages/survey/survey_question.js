var surveyUtils = require('./survey_utils');

module.exports = function(params) {
    var self = this;

    self.collectionName = params.collectionName;
    self.elementsObs = params.elementsObs;
    self.element = params.element;
    self.indexObs = params.indexObs;
    self.promptObs = self.element.promptObs;
    self.promptDetailObs = self.element.promptDetailObs;
    // SAFARI: This shows 'undefined' unless you enter a blank space.
    //self.promptDetailObs(self.promptDetailObs() || '');
    self.identifierObs = self.element.identifierObs;

    self.copy = surveyUtils.makeCopy(params.elementsObs, params.indexObs);
    self.create = surveyUtils.makeCreate(params.elementsObs, params.indexObs);
};