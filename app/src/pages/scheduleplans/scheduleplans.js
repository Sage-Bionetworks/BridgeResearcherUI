var serverService = require('../../services/server_service.js');
var optionsService = require('../../services/options_service.js');
var scheduleUtils = require('../schedule/schedule_utils.js');
var utils = require('../../utils');
var fn = require('../../transforms');
var tables = require('../../tables');
var root = require('../../root');
var Promise = require('bluebird');

var SORTER = utils.makeFieldSorter("label");

function deleteItem(plan) {
    return serverService.deleteSchedulePlan(plan.guid);
}

module.exports = function() {
    var self = this;
    self.allItems = [];

    self.isAdmin = root.isAdmin;
    self.isDeveloper = root.isDeveloper;
    
    tables.prepareTable(self, {
        name: "schedule",
        type: "SchedulePlan", 
        delete: deleteItem, 
        refresh: load
    });

    self.formatDateTime = fn.formatLocalDateTime;
    self.formatScheduleType = scheduleUtils.formatScheduleStrategyType;
    self.formatStrategy = scheduleUtils.formatStrategy;

    function load() {
        scheduleUtils.loadOptions().then(function() {
            return serverService.getSchedulePlans();
        }).then(function(response) {
            return Promise.map(response.items, function(plan) {
                return Promise.map(optionsService.getActivities(plan), function(activity) {
                    if (activity.activityType === "compound") {
                        return serverService.getTaskDefinition(activity.compoundActivity.taskIdentifier)
                            .then(function(task) {
                                activity.compoundActivity = task;
                                activity.compoundActivity.taskIdentifier = task.taskId;
                                return activity;
                            });
                    }
                    return Promise.resolve(activity);
                });
            }).then(function() {
                response.items.sort(SORTER);
                self.itemsObs(response.items);
            }).catch(utils.listFailureHandler(self.itemsObs));
        });
    }
    load();
};