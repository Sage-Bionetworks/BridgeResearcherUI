import Promise from 'bluebird';
import fn from '../../functions';
import optionsService from '../../services/options_service';
import root from '../../root';
import scheduleUtils from '../schedule/schedule_utils';
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

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
            }).catch(utils.failureHandler());
    }
    load();
};