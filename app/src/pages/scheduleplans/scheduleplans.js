import {serverService} from '../../services/server_service';
import fn from '../../functions';
import optionsService from '../../services/options_service';
import Promise from 'bluebird';
import root from '../../root';
import scheduleUtils from '../schedule/schedule_utils';
import tables from '../../tables';
import utils from '../../utils';

function deleteItem(plan) {
    return serverService.deleteSchedulePlan(plan.guid);
}

module.exports = function() {
    let self = this;
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
    self.copy = function(vm, event) {
        let copyables = this.itemsObs().filter(tables.hasBeenChecked);
        let confirmMsg = (copyables.length > 1) ?
            "Schedules have been copied." : "Schedule has been copied.";

        utils.startHandler(vm, event);
        Promise.mapSeries(copyables, function(schedule) {
            schedule.label += " (Copy)";
            delete schedule.guid;
            delete schedule.version;
            return serverService.createSchedulePlan(schedule);
        }).then(load)
            .then(utils.successHandler(vm, event, confirmMsg))
            .catch(utils.failureHandler({transient:false}));
    };

    function load() {
        scheduleUtils.loadOptions()
            .then(serverService.getSchedulePlans.bind(serverService))
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
