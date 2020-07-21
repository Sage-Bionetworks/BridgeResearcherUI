import fn from "../functions";
import serverService from "./server_service";
import Promise from "bluebird";

const CATEGORIES = {
  'Customization Options': 'customization_options',
  'Data Repositories': 'data_repository',
  'Science Documentation': 'science_documentation',
  'Developer Documentation': 'developer_documentation',
  'Licenses': 'license',
  'Publications': 'publication',
  'Release Notes': 'release_note',
  'Sample Apps': 'sample_app',
  'Sample Data': 'sample_data',
  'Screenshots': 'screenshot',
  'Video Previews': 'video_preview',
  'See Also': 'see_also',
  'Used in Studies': 'used_in_study',
  'Websites': 'website',
  'Other': 'other'
};

const CATEGORY_LABELS = {};

Object.keys(CATEGORIES).map(label => {
  CATEGORY_LABELS[CATEGORIES[label]] = label;
});

function getCategoryOptions() {
  // let opts = Objects.keys(CATEGORIES).map(key => ({label: CATEGORIES[key], value: key}));
  // return [{ value: "", label: "Select category:" }].concat(opts);
  return Object.keys(CATEGORIES).map(key => ({label: key, value: CATEGORIES[key]}));
}
function getCategorylabel(value) {

}

const LABEL_SORTER = fn.makeFieldSorter("label");

function getSchedule(group) {
  return group.schedule;
}
function getSchedules(plan) {
  switch (plan.strategy.type) {
    case "SimpleScheduleStrategy":
      return [plan.strategy.schedule];
    case "ABTestScheduleStrategy":
      return plan.strategy.scheduleGroups.map(getSchedule);
    case "CriteriaScheduleStrategy":
      return plan.strategy.scheduleCriteria.map(getSchedule);
  }
}
function getActivityOptions() {
  return serverService.getSchedulePlans().then(function(response) {
    let activities = [];
    response.items.forEach(function(plan) {
      let schedules = getSchedules(plan);
      schedules.forEach(function(schedule) {
        let multi = schedule.activities.length > 1;
        schedule.activities.forEach(function(activity, i) {
          let actLabel = multi ? activity.label + " (" + plan.label + " activity #" + (i + 1) + ")" : activity.label;
          activities.push({ label: actLabel, value: activity.guid });
        });
      });
    }, []);
    return activities.sort(LABEL_SORTER);
  });
}
function getSurveyOptions() {
  return serverService
    .getPublishedSurveys()
    .then(fn.handleSort("items", "name"))
    .then(collectSurveyOptions);
}
function collectSurveyOptions(surveys) {
  let surveyOpts = surveys.items.map(function(survey) {
    return { label: survey.name, value: survey.guid };
  });
  return [{ value: "", label: "Select survey:" }].concat(surveyOpts);
}
function getTaskIdentifierOptions() {
  return serverService.getApp().then(function(app) {
    let taskOpts = app.taskIdentifiers.map(function(id) {
      return { label: id, value: id };
    });
    return [{ value: "", label: "Select task:" }].concat(taskOpts);
  });
}
function getActivities(plan) {
  return getSchedules(plan).reduce(function(array, schedule) {
    return [].concat(schedule.activities);
  }, []);
}
function getCompoundActivityOptions() {
  return serverService.getTaskDefinitions().then(function(response) {
    let opts = response.items.map(function(task) {
      return { label: task.taskId, value: task.taskId };
    });
    return [{ value: "", label: "Select compound task:" }].concat(opts);
  });
}

let orgNamesMap = {};

function getOrganizationNames() {
  if (Object.keys(orgNamesMap).length) {
    return Promise.resolve(orgNamesMap);
  }
  return serverService.getOrganizations(0, 100).then(response => {
    return response.items.reduce((map, org) => {
      map[org.identifier] = org.name;
      return map;
    }, orgNamesMap);
  });
}
export default {
  CATEGORIES,
  CATEGORY_LABELS,
  getCategoryOptions,
  getActivities,
  getSchedules,
  getActivityOptions,
  getOrganizationNames,
  getSurveyOptions,
  getTaskIdentifierOptions,
  getCompoundActivityOptions
};
