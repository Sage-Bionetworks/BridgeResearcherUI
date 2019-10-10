import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import scheduleUtils from "./schedule_utils";
import scheduleFormatter from "../../schedule_formatter";
import utils from "../../utils";
import Binder from "../../binder";

const SCHEDULE_TYPE_OPTIONS = Object.freeze([
  { value: "once", label: "Once" },
  { value: "recurring", label: "Recurring" },
  { value: "cron", label: "Cron-based" },
  { value: "persistent", label: "Persistent" }
]);
const ACTIVITY_TYPE_OPTIONS = Object.freeze([
  { value: "task", label: "Do Task" },
  { value: "compound", label: "Do Compound Task" },
  { value: "survey", label: "Take Survey" }
]);
function newActivity() {
  let activity = scheduleUtils.newSchedule().activities[0];
  activity.activityType = "task";
  addObserversToActivity(activity);
  return activity;
}
function addObserversToActivity(activity) {
  activity.labelObs = ko.observable(activity.label);
  activity.labelDetailObs = ko.observable(activity.labelDetail);
  activity.activityTypeObs = ko.observable(activity.activityType);
  activity.taskIdObs = ko.observable();
  if (activity.activityType === "task") {
    activity.taskIdObs(activity.task.identifier);
  }
  activity.surveyGuidObs = ko.observable();
  if (activity.activityType === "survey") {
    activity.surveyGuidObs(activity.survey.guid);
  }
  activity.compoundTaskIdObs = ko.observable();
  if (activity.activityType === "compound") {
    activity.compoundTaskIdObs(activity.compoundActivity.taskIdentifier);
  }
  return activity;
}
function extractActivityFromObservables(activity) {
  let act = {
    label: activity.labelObs(),
    guid: activity.guid,
    labelDetail: activity.labelDetailObs(),
    activityType: activity.activityTypeObs()
  };
  if (act.activityType === "task") {
    act.task = { identifier: activity.taskIdObs() };
  } else if (act.activityType === "survey") {
    act.survey = { guid: activity.surveyGuidObs() };
  } else if (act.activityType === "compound") {
    act.compoundActivity = { taskIdentifier: activity.compoundTaskIdObs() };
  }
  return act;
}
function updateView(self, schedule, fields) {
  fields.forEach(function(field) {
    self[field + "Obs"](schedule[field]);
  });
}
function getEditorType(schedule) {
  if (schedule.scheduleType === "once") {
    return "once";
  } else if (schedule.scheduleType === "recurring" && schedule.sequencePeriod) {
    return "sequence";
  } else if (schedule.scheduleType === "recurring" && schedule.cronTrigger) {
    return "cron";
  } else if (schedule.scheduleType === "recurring") {
    return "interval";
  }
  return "persistent";
}
function getScheduleType(editorType) {
  return editorType === "sequence" || editorType === "cron" || editorType === "interval" ? "recurring" : editorType;
}

export default function(params) {
  let self = this;

  fn.copyProps(self, params, "collectionName");
  fn.copyProps(self, fn, "formatDateTime");
  fn.copyProps(self, scheduleUtils, "formatEventId", "surveysOptionsObs", "taskOptionsObs", "compoundActivityOptionsObs");
  fn.copyProps(self, scheduleFormatter, "formatTimesArray->formatTimes");

  self.scheduleTypeOptions = SCHEDULE_TYPE_OPTIONS;
  self.scheduleTypeLabel = utils.makeOptionLabelFinder(SCHEDULE_TYPE_OPTIONS);

  self.activityTypeOptions = ACTIVITY_TYPE_OPTIONS;
  self.activityTypeLabel = utils.makeOptionLabelFinder(ACTIVITY_TYPE_OPTIONS);

  new Binder(self)
    .obs("eventId")
    .obs("scheduleType")
    .obs("startsOn")
    .obs("endsOn")
    .obs("delay")
    .obs("interval")
    .obs("times")
    .obs("cronTrigger")
    .obs("expires")
    .obs("sequencePeriod")
    .obs("activities[]");

  if (params.scheduleHolder) {
    self.dispose = function() {
      let holder = params.scheduleHolder;
      let sch = readEditor();
      holder.schedule = sch;
      holder.scheduleObs(sch);
    };
  }

  function updateEditor(schedule) {
    // TODO: This could be replaced with a binder update probably
    updateView(self, schedule, [
      "eventId",
      "scheduleType",
      "startsOn",
      "endsOn",
      "delay",
      "interval",
      "times",
      "cronTrigger",
      "expires",
      "sequencePeriod"
    ]);
    self.editorScheduleTypeObs(getEditorType(schedule));
    self.activitiesObs(schedule.activities.map(addObserversToActivity));
  }
  function readEditor() {
    let sch = {
      eventId: self.eventIdObs(),
      scheduleType: self.scheduleTypeObs(),
      startsOn: self.startsOnObs(),
      endsOn: self.endsOnObs(),
      delay: self.delayObs(),
      interval: self.intervalObs(),
      times: self.timesObs(),
      cronTrigger: self.cronTriggerObs(),
      expires: self.expiresObs(),
      sequencePeriod: self.sequencePeriodObs(),
      activities: self.activitiesObs().map(extractActivityFromObservables)
    };
    fn.deleteUnusedProperties(sch);
    // some of these properties are mutually exclusive so based on the type of schedule,
    // delete some fields. This comes up if you schedule one way, then change and schedule another
    // way.
    switch (self.editorScheduleTypeObs()) {
      case "once":
        delete sch.interval;
        delete sch.cronTrigger;
        delete sch.sequencePeriod;
        break;
      case "interval":
        delete sch.cronTrigger;
        delete sch.sequencePeriod;
        break;
      case "cron":
        delete sch.interval;
        delete sch.times;
        delete sch.sequencePeriod;
        break;
      case "persistent":
        delete sch.interval;
        delete sch.cronTrigger;
        delete sch.times;
        delete sch.delay;
        delete sch.expires;
        delete sch.sequencePeriod;
    }
    return sch;
  }
  params.scheduleObs.subscribe(updateEditor);
  params.scheduleObs.callback = readEditor;

  self.editorScheduleTypeObs = ko.observable();
  self.editorScheduleTypeObs.subscribe(function(newValue) {
    self.scheduleTypeObs(getScheduleType(newValue));
  });

  self.editTimes = function(vm, event) {
    event.preventDefault();
    root.openDialog("times_editor", {
      timesObs: self.timesObs,
      scheduleTypeObs: self.scheduleTypeObs,
      clearTimesFunc: self.clearTimes
    });
  };
  self.clearTimes = function(vm, event) {
    event.preventDefault();
    self.timesObs([]);
  };
  self.formatWindow = function() {
    if (self.startsOnObs() || self.endsOnObs()) {
      let string = "";
      if (self.startsOnObs()) {
        string += fn.formatDateTime(self.startsOnObs());
      }
      string += "&mdash;";
      if (self.endsOnObs()) {
        string += fn.formatDateTime(self.endsOnObs());
      }
      return string;
    }
    return "&lt;None&gt;";
  };
  self.editWindow = function(vm, event) {
    event.preventDefault();
    root.openDialog("date_window_editor", {
      startsOnObs: self.startsOnObs,
      endsOnObs: self.endsOnObs,
      clearWindowFunc: self.clearWindow
    });
  };
  self.clearWindow = function() {
    self.startsOnObs(null);
    self.endsOnObs(null);
  };
  self.editEventId = function(vm, event) {
    event.preventDefault();
    root.openDialog("event_id_editor", { eventIdObs: self.eventIdObs, clearEventIdFunc: self.clearEventId });
  };
  self.clearEventId = function(vm, event) {
    event.preventDefault();
    self.eventIdObs(null);
  };
  self.addFirstActivity = function(vm, event) {
    self.activitiesObs.push(newActivity());
  };
  self.addActivityAfter = function(vm, event) {
    event.preventDefault();
    let context = ko.contextFor(event.target);
    self.activitiesObs.splice(context.$index() + 1, 0, newActivity());
  };
  self.copyGuid = function(item, event) {
    utils.copyString(item.guid);
  };

  // Finally... update with the schedule if we already have it from the server, as knockout
  // recreates the views when you use dragula to reorder the list of scheduleCriteria.
  if (params.scheduleObs()) {
    updateEditor(params.scheduleObs());
  }
};
