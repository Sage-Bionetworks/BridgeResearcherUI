var serverService = require('./server_service');
var utils = require('../utils');

var NAME_SORTER = utils.makeFieldSorter('name');
var LABEL_SORTER = utils.makeFieldSorter('label');

function getSchedules(object, array) {
    array = array || [];
    for (var prop in object) {
        if (prop === "schedule") {
            array.push(object[prop]);
        } else if (typeof object[prop] === 'object') {
            return getSchedules(object[prop], array);
        }
    }
    return array;
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
            var versionString = formatVersionRange(plan.minAppVersion, plan.maxAppVersion);
            getSchedules(plan).forEach(function(schedule) {
                schedule.activities.forEach(function(activity) {
                    var actLabel = activity.label + versionString;
                    activities.push({label: actLabel, "value": activity.guid});
                });
            });
        });
        return activities.sort(LABEL_SORTER);
    });
}
function getSurveyOptions() {
    return serverService.getSurveysSummarized().then(sortSurveys).then(collectSurveyOptions);
}
function getQuestionOptions() {
    return serverService.getSurveysSummarized().then(sortSurveys).then(collectQuestionOptions);
}
function sortSurveys(response) {
    return response.items.sort(NAME_SORTER);
}
function collectSurveyOptions(surveys) {
    return surveys.map(function(survey) {
        return { label: survey.name, value: survey.guid };
    });
}
function collectQuestionOptions(surveys) {
    var questions = []
    surveys.forEach(function(survey) {
        survey.elements.filter(filterQuestions).then(function (questions) {
            questions.forEach(function(question) {
                var label = survey.name+": "+question.identifier+((question.fireEvent)?" *":"");
                questions.push({ label: label, value: question.guid });
            });
        });
    });
    return questions;
}
function filterQuestions(element) {
    return (element.type === "SurveyQuestion");
}

module.exports = {
    getActivityOptions: getActivityOptions,
    getSurveyOptions: getSurveyOptions,
    getQuestionOptions: getQuestionOptions
};