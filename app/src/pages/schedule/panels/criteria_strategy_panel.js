var utils = require('../../../utils');
var ko = require('knockout');
require('knockout-postbox');

module.exports = function(params) {
    var self = this;

    self.labelObs = params.viewModel.labelObs;
    self.scheduleCriteriaObs = params.viewModel.scheduleCriteriaObs;

    self.selectCriteria = utils.makeEventToPostboxListener("scheduleCriteriaSelect");
    self.removeCriteria = utils.makeEventToPostboxListener("scheduleCriteriaRemove");
    self.addCriteria = utils.makeEventToPostboxListener("scheduleCriteriaAdd");
    
    // Pretty ugly, but this is fired from the criteria editor if you supply the observer
    // to fire the event on. We're listening for this and forcing the label observable to 
    // update without going through the criteriaObs dependencies, because these are circular.
    // Wish I knew a better way to do this... knockout is flexible but these parallel components
    // communicating across to each other is really a mess.
    ko.postbox.subscribe("scheduleCriteriaChanges", function(scheduleCriteria) {
        scheduleCriteria.forEach(function(schCrit) {
            schCrit.labelObs.respondToChange();
        });
    });
};
