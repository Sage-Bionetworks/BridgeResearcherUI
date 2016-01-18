var ko = require('knockout');
require('knockout-postbox');

module.exports = function(params) {
    var self = this;

    self.labelObs = params.viewModel.labelObs;
    var criteria = params.viewModel.strategyObs().scheduleCriteria;
    self.scheduleCriteriaObs = ko.observableArray(criteria).subscribeTo("scheduleCriteriaChanges");

    self.selectCriteria = function(group, event) {
        event.preventDefault();
        event.stopPropagation();
        ko.postbox.publish("scheduleCriteriaSelect", group);
    };
    self.removeCriteria = function(group, event) {
        event.preventDefault();
        event.stopPropagation();
        ko.postbox.publish("scheduleCriteriaRemove", group);
    };
    self.addCriteria = function(vm, event) {
        event.preventDefault();
        event.stopPropagation();
        ko.postbox.publish("scheduleCriteriaAdd");
    };
};
