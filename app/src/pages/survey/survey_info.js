
module.exports = function(params) {
    var self = this;
    self.elementsObs = params.elementsObs;
    self.element = params.element;
    self.publishedObs = params.publishedObs;
    self.indexObs = params.indexObs;
    self.titleObs = self.element.titleObs;
    self.promptObs = self.element.promptObs;
    self.promptDetailObs = self.element.promptDetailObs;
    self.identifierObs = self.element.identifierObs;

};