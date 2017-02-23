var serverService = require('./server_service');
var utils = require('../utils');

var NAME_SORTER = utils.makeFieldSorter('name');
var LABEL_SORTER = utils.makeFieldSorter('label');

function getSchedule(group) {
    return group.schedule;
}
function getSchedules(plan) {
    switch(plan.strategy.type) {
        case 'SimpleScheduleStrategy':
            return [plan.strategy.schedule];
        case 'ABTestScheduleStrategy':
            return plan.strategy.scheduleGroups.map(getSchedule);
        case 'CriteriaScheduleStrategy':
            return plan.strategy.scheduleCriteria.map(getSchedule);
    }
}
function getActivityOptions() {
    return serverService.getSchedulePlans().then(function(response) {
        var activities = [];
        response.items.forEach(function(plan) {
            var schedules = getSchedules(plan);
            schedules.forEach(function(schedule) {
                var multi = schedule.activities.length > 1;
                schedule.activities.forEach(function(activity, i) {
                    var actLabel = (multi) ? 
                        (activity.label + " ("+plan.label+" activity #"+(i+1)+")") : activity.label; 
                    activities.push({label: actLabel, "value": activity.guid});
                });
            });
        }, []);
        return activities.sort(LABEL_SORTER);
    });
}
function getSurveyOptions() {
    return serverService.getPublishedSurveys()
        .then(sortSurveys)
        .then(collectSurveyOptions);
}
function sortSurveys(response) {
    return response.items.sort(NAME_SORTER);
}
function collectSurveyOptions(surveys) {
    var surveyOpts = surveys.map(function(survey) {
        return { label: survey.name, value: survey.guid };
    });
    return [{value:"",label:"Select survey:"}].concat(surveyOpts);
}
function getTaskIdentifierOptions() {
    return serverService.getStudy().then(function(study) {
        var taskOpts = study.taskIdentifiers.map(function(id) {
            return { label:id, value:id };
        });
        return [{value:"",label:"Select task:"}].concat(taskOpts);
    });
}
function getActivities(plan) {
    return getSchedules(plan).reduce(function(array, schedule) {
        return [].concat(schedule.activities);
    }, []);
}
function getCompoundActivityOptions() {
    return serverService.getTaskDefinitions().then(function(response) {
        var opts = response.items.map(function(task) {
            return {label: task.taskId, value: task.taskId, compoundActivity: task};
        });
        return [{value:"",label:"Select compound task:"}].concat(opts);
    });
}
module.exports = {
    getActivities: getActivities,
    getSchedules: getSchedules,
    getActivityOptions: getActivityOptions,
    getSurveyOptions: getSurveyOptions,
    getTaskIdentifierOptions: getTaskIdentifierOptions,
    getCompoundActivityOptions: getCompoundActivityOptions
};