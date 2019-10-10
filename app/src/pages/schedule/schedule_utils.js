import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import ko from "knockout";
import optionsService from "../../services/options_service";
import Promise from "bluebird";
import serverService from "../../services/server_service";
import utils from "../../utils";

import scheduleFormatter from "../../schedule_formatter";

// This is duplicated in sharedModuleUtils.
const surveyNameMap = {};

const activitiesObs = ko.observableArray([]);
const activityOptionsLabel = utils.makeOptionLabelFinder(activitiesObs);

const surveysOptionsObs = ko.observableArray([]);
const surveysOptionsLabel = utils.makeOptionLabelFinder(surveysOptionsObs);

const taskOptionsObs = ko.observableArray([]);
const taskOptionsLabel = utils.makeOptionLabelFinder(taskOptionsObs);

const compoundActivityOptionsObs = ko.observableArray([]);

const STRATEGY_OPTIONS = Object.freeze([
  { value: "SimpleScheduleStrategy", label: "Simple Schedule" },
  { value: "ABTestScheduleStrategy", label: "A/B Test Schedule" },
  { value: "CriteriaScheduleStrategy", label: "Criteria-based Schedule" }
]);

const schedulePlanTypeOptions = STRATEGY_OPTIONS;
const schedulePlanTypeLabel = utils.makeOptionLabelFinder(STRATEGY_OPTIONS);

function newStrategy(type, existingStrategy) {
  let schedules = existingStrategy ? extractSchedules(existingStrategy) : [newSchedule()];
  switch (type) {
    case "SimpleScheduleStrategy":
      return cloneSimpleStrategy(schedules);
    case "ABTestScheduleStrategy":
      return cloneABTestStrategy(schedules);
    case "CriteriaScheduleStrategy":
      return cloneCriteriaStrategy(schedules);
    default:
      throw new Error("Strategy type " + type + " not mapped.");
  }
}
function extractSchedules(strategy) {
  switch (strategy.type) {
    case "SimpleScheduleStrategy":
      return [strategy.schedule];
    case "ABTestScheduleStrategy":
      return strategy.scheduleGroups.map(scheduleFromGroup);
    case "CriteriaScheduleStrategy":
      return strategy.scheduleCriteria.map(scheduleFromGroup);
  }
}
function scheduleFromGroup(group) {
  return group.schedule;
}
function cloneSimpleStrategy(schedules) {
  return { type: "SimpleScheduleStrategy", schedule: schedules[0] };
}
function cloneABTestStrategy(schedules) {
  return {
    type: "ABTestScheduleStrategy",
    scheduleGroups: schedules.map(function(schedule) {
      return { percentage: 0, schedule: schedule };
    })
  };
}
function cloneCriteriaStrategy(schedules) {
  return {
    type: "CriteriaScheduleStrategy",
    scheduleCriteria: schedules.map(function(schedule) {
      return { criteria: criteriaUtils.newCriteria(), schedule: schedule };
    })
  };
}
function newSchedule() {
  return {
    scheduleType: "once",
    eventId: null,
    delay: null,
    interval: null,
    expires: null,
    cronTrigger: null,
    startsOn: null,
    endsOn: null,
    times: [],
    activities: [{ label: "", labelDetail: "", activityType: "task", task: { identifier: "" } }]
  };
}
function newSchedulePlan() {
  return { type: "SchedulePlan", label: "", strategy: cloneSimpleStrategy([newSchedule()]) };
}
function formatSchedule(sch) {
  return scheduleFormatter.formatSchedule(sch, activityOptionsLabel, taskOptionsLabel, surveysOptionsLabel);
}
function formatEventId(eventId) {
  return fn.formatSentenceCase(scheduleFormatter.formatEventId(eventId, activityOptionsLabel));
}
function formatStrategy(strategy) {
  if (strategy.type === "SimpleScheduleStrategy") {
    return formatSchedule(strategy.schedule);
  } else if (strategy.type === "ABTestScheduleStrategy") {
    return strategy.scheduleGroups.map(function(group) {
      return "<span class='times-label'>" + group.percentage + "%:</span> " + formatSchedule(group.schedule);
    }).join("<br>");
  } else if (strategy.type === "CriteriaScheduleStrategy") {
    return strategy.scheduleCriteria.map(function(group) {
        return (
          "<span class='times-label'>" +
          criteriaUtils.label(group.criteria) +
          ":</span> " +
          formatSchedule(group.schedule)
        );
      }).join("<br>");
  } else {
    return "<i>Unknown</i>";
  }
}
function formatScheduleStrategyType(type) {
  return STRATEGY_OPTIONS[type].label;
}
function formatCompoundActivity(task) {
  let phrase = [];
  let schemas = (task.schemaList || task.schemaReferences)
    .map(function(schema) {
      return schema.revision ? `${schema.id} schema <i>(rev. ${schema.revision})</i>` : schema.id;
    })
    .join(", ");
  if (schemas) {
    phrase.push(schemas);
  }
  let surveys = (task.surveyList || task.surveyReferences)
    .map(function(survey) {
      let surveyName = surveyNameMap[survey.guid];
      return survey.createdOn ? 
        `${surveyName} survey <i>(pub. ${fn.formatDateTime(survey.createdOn)})</i>` : 
        surveyName;
    })
    .join(", ");
  let configs = (task.configList || task.configReferences || [])
    .map(function(config) {
      return `${config.id} config <i>(rev. ${config.revision})</i>`;
    })
    .join(", ");
  if (configs) {
    phrase.push(configs);
  }
  if (surveys) {
    phrase.push(surveys);
  }
  return phrase.join("<br>");
}
function loadFormatCompoundActivity() {
  return serverService.getSurveys().then(function(response) {
    response.items.forEach(function(survey) {
      surveyNameMap[survey.guid] = survey.name;
    });
  });
}
export default {
  newSchedule,
  newSchedulePlan,
  newStrategy,
  formatEventId,
  formatStrategy,
  formatSchedule,
  formatCompoundActivity,
  formatScheduleStrategyType,
  activitiesObs,
  surveysOptionsObs,
  taskOptionsObs,
  compoundActivityOptionsObs,
  schedulePlanTypeOptions,
  schedulePlanTypeLabel,
  loadOptions: function() {
    let p1 = optionsService.getActivityOptions().then(activitiesObs);
    let p2 = optionsService.getSurveyOptions().then(surveysOptionsObs);
    let p3 = optionsService.getTaskIdentifierOptions().then(taskOptionsObs);
    let p4 = loadFormatCompoundActivity();
    let p5 = optionsService.getCompoundActivityOptions().then(compoundActivityOptionsObs);
    return Promise.all([p1, p2, p3, p4, p5]);
  }
};
