var serverService = require('./server_service');
var utils = require('../utils');

var NAME_SORTER = utils.makeFieldSorter('name');
var LABEL_SORTER = utils.makeFieldSorter('label');

function getSchedules(plan) {
    switch(plan.strategy.type) {
        case 'SimpleScheduleStrategy':
            return [plan.strategy.schedule];
        case 'ABTestScheduleStrategy':
            return plan.strategy.scheduleGroups.map(function(group) {
                return group.schedule;
            });
        case 'CriteriaScheduleStrategy':
            return plan.strategy.scheduleCriteria.map(function(group) {
                return group.schedule;
            });
    }
}
function formatVersionRange(minValue, maxValue) {
    if (utils.isDefined(minValue) && utils.isDefined(maxValue)) {
        return " ("+minValue + "-" + maxValue + ")";
    } else if (utils.isDefined(minValue)) {
        return " ("+minValue + "+)";
    } else if (utils.isDefined(maxValue)) {
        return " (0-" + maxValue + ")";
    }
    return "";
}
function getActivityOptions() {
    return serverService.getSchedulePlans().then(function(response) {
        var activities = [];
        response.items.forEach(function(plan) {
            getSchedules(plan).forEach(function(schedule) {
                var multi = schedule.activities.length > 1;
                schedule.activities.forEach(function(activity, i) {
                    var actLabel = (multi) ? 
                        (activity.label + " ("+plan.label+" activity #"+(i+1)+")") : activity.label; 
                    activities.push({label: actLabel, "value": activity.guid});
                });
            });
        });
        return activities.sort(LABEL_SORTER);
    });
}
function getSurveyOptions() {
    return serverService.getPublishedSurveys().then(sortSurveys).then(collectSurveyOptions);
}
function sortSurveys(response) {
    return response.items.sort(NAME_SORTER);
}
function collectSurveyOptions(surveys) {
    return surveys.map(function(survey) {
        return { label: survey.name, value: survey.guid };
    });
}
function getTaskIdentifierOptions() {
    return serverService.getStudy().then(function(study) {
        return study.taskIdentifiers.map(function(id) {
            return { label:id, value:id };
        });
    });
}

module.exports = {
    getActivityOptions: getActivityOptions,
    getSurveyOptions: getSurveyOptions,
    //getQuestionOptions: getQuestionOptions,
    getTaskIdentifierOptions: getTaskIdentifierOptions
};