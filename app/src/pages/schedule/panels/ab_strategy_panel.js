var ko = require('knockout');
require('knockout-postbox');

module.exports = function(params) {
    var self = this;

    self.labelObs = params.viewModel.labelObs;
    var groups = params.viewModel.strategyObs().scheduleGroups;
    self.scheduleGroupsObs = ko.observableArray(groups).subscribeTo("scheduleGroupChanges");

    self.selectGroup = function(group, event) {
        event.preventDefault();
        event.stopPropagation();
        ko.postbox.publish("scheduleGroupSelect", group);
    };
    self.removeGroup = function(group, event) {
        event.preventDefault();
        event.stopPropagation();
        ko.postbox.publish("scheduleGroupRemove", group);
    };
    self.addGroup = function(vm, event) {
        event.preventDefault();
        event.stopPropagation();
        ko.postbox.publish("scheduleGroupAdd");
    };
};
