var serverService = require('../../services/server_service.js');
var optionsService = require('../../services/options_service.js');
var scheduleUtils = require('../schedule/schedule_utils.js');
var utils = require('../../utils');
var fn = require('../../functions');
var tables = require('../../tables');
var root = require('../../root');
var Promise = require('bluebird');

function deleteItem(plan) {
    return serverService.deleteSchedulePlan(plan.guid);
}

module.exports = function() {
    var self = this;
    self.allItems = [];

    fn.copyProps(self, root, 'isAdmin', 'isDeveloper');
    fn.copyProps(self, fn, 'formatDateTime');
    fn.copyProps(self, scheduleUtils, 'formatScheduleStrategyType->formatScheduleType', 'formatStrategy');
    
    tables.prepareTable(self, {
        name: "schedule",
        type: "SchedulePlan", 
        delete: deleteItem, 
        refresh: load
    });

    function processActivity(activity) {
        if (activity.activityType !== "compound") {
            return Promise.resolve(activity);
        }
        return serverService.getTaskDefinition(activity.compoundActivity.taskIdentifier)
            .then(function(task) {
                activity.compoundActivity = task;
                activity.compoundActivity.taskIdentifier = task.taskId;
                return activity;
            });
    }

    function load() {
        scheduleUtils.loadOptions()
            .then(serverService.getSchedulePlans)
            .then(fn.handleSort('items', 'label'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .then(function(response) {
                return Promise.map(response.items, function(plan) {
                    return Promise.map(optionsService.getActivities(plan), processActivity);
                });
            }).catch(utils.listFailureHandler());
    }
    load();
};