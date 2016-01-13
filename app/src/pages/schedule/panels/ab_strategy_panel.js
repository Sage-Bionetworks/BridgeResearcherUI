var ko = require('knockout');
require('knockout-postbox');
var scheduleUtils = require('../schedule_utils');

module.exports = function(params) {
    var self = this;

    self.formatSchedule = scheduleUtils.formatSchedule;
    self.scheduleGroupsObs = ko.observableArray([]).syncWith("scheduleGroupChanges");

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
