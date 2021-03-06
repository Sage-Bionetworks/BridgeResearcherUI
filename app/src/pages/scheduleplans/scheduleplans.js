import fn from "../../functions";
import ko from "knockout";
import optionsService from "../../services/options_service";
import Promise from "bluebird";
import root from "../../root";
import scheduleUtils from "../schedule/schedule_utils";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function schedulePlans() {
  let self = this;
  self.allItems = [];

  fn.copyProps(self, root, "isDeveloper");
  fn.copyProps(self, fn, "formatDateTime");
  fn.copyProps(self, scheduleUtils, "formatScheduleStrategyType->formatScheduleType", "formatStrategy");

  tables.prepareTable(self, {
    name: "schedule",
    type: "SchedulePlan",
    id: 'scheduleplans',
    refresh: load,
    delete: plan => serverService.deleteSchedulePlan(plan.guid, false),
    deletePermanently: plan => serverService.deleteSchedulePlan(plan.guid, true),
    undelete: plan => serverService.saveSchedulePlan(plan)
  });

  function processActivity(activity) {
    if (activity.activityType !== "compound") {
      return Promise.resolve(activity);
    }
    return serverService.getTaskDefinition(activity.compoundActivity.taskIdentifier).then(function(task) {
      activity.compoundActivity = task;
      activity.compoundActivity.taskIdentifier = task.taskId;
      return activity;
    });
  }
  self.copy = function(vm, event) {
    let copyables = this.itemsObs().filter(tables.hasBeenChecked);
    let confirmMsg = copyables.length > 1 ? "Schedules have been copied." : "Schedule has been copied.";

    utils.startHandler(vm, event);
    Promise.mapSeries(copyables, function(schedule) {
      schedule.label += " (Copy)";
      delete schedule.guid;
      delete schedule.version;
      return serverService.createSchedulePlan(schedule);
    })
      .then(load)
      .then(utils.successHandler(vm, event, confirmMsg))
      .catch(utils.failureHandler({ transient: false, id: 'scheduleplans' }));
  };

  function load() {
    scheduleUtils.loadOptions()
      .then(() => serverService.getSchedulePlans(self.showDeletedObs()))
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(function(response) {
        return Promise.map(response.items, function(plan) {
          plan.deletedObs = ko.observable(plan.deleted || false);
          return Promise.map(optionsService.getActivities(plan), processActivity);
        });
      })
      .catch(utils.failureHandler({ id: 'scheduleplans' }));
  }
  load();
};
