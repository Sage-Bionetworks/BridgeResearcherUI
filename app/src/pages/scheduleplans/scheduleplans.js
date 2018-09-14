import {serverService} from '../../services/server_service';
import fn from '../../functions';
import ko from 'knockout';
import optionsService from '../../services/options_service';
import Promise from 'bluebird';
import root from '../../root';
import scheduleUtils from '../schedule/schedule_utils';
import tables from '../../tables';
import utils from '../../utils';

module.exports = function() {
    let self = this;
    self.allItems = [];

    fn.copyProps(self, root, 'isDeveloper');
    fn.copyProps(self, fn, 'formatDateTime');
    fn.copyProps(self, scheduleUtils, 'formatScheduleStrategyType->formatScheduleType', 'formatStrategy');
    
    tables.prepareTable(self, {
        name: "schedule",
        type: "SchedulePlan", 
        refresh: load, 
        delete: function(plan) {
            return serverService.deleteSchedulePlan(plan.guid, false);
        }, 
        deletePermanently: function(plan) {
            return serverService.deleteSchedulePlan(plan.guid, true);
        },
        undelete: function(plan) {
            return serverService.saveSchedulePlan(plan);
        }
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
    function getSchedulePlans() {
        return serverService.getSchedulePlans(self.showDeletedObs());
    }

    function load() {
        scheduleUtils.loadOptions()
            .then(getSchedulePlans)
            .then(fn.handleSort('items', 'label'))
            .then(fn.handleForEach('items', (plan) => {
                // REMOVEME
                plan.deletedObs = ko.observable(plan.deleted || false);
            }))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .then(function(response) {
                return Promise.map(response.items, function(plan) {
                    plan.deletedObs = ko.observable(plan.deleted || false);
                    return Promise.map(optionsService.getActivities(plan), processActivity);
                });
            }).catch(utils.failureHandler());
    }
    load();
};
