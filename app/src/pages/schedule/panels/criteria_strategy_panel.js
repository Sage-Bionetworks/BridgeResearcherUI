var ko = require('knockout');
require('knockout-postbox');
var scheduleUtils = require('../schedule_utils');
var criteriaUtils = require('../../../criteria_utils');

module.exports = function(params) {
    var self = this;

    self.formatSchedule = scheduleUtils.formatSchedule;
    self.scheduleCriteriaObs = ko.observableArray([]).syncWith("scheduleCriteriaChanges");
    self.criteriaLabel = criteriaUtils.label;

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
