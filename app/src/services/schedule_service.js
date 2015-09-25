var ko = require('knockout');
var utils = require('../utils');
var serverService = require('./server_service');

var surveysOptionsObs = ko.observableArray([]);
var surveysOptionsLabelFinder = utils.makeOptionLabelFinder(surveysOptionsObs);

var questionsOptionsObs = ko.observableArray([]);
var questionsOptionsLabelFinder = utils.makeOptionLabelFinder(questionsOptionsObs)

var TIME_OPTIONS = [];
var MINUTES = ["00","30"];
var timeFormatter = utils.makeOptionLabelFinder(TIME_OPTIONS);
for (var i=0; i < 24; i++) {
    var hour = (i === 0) ? 12 : (i > 12) ? i-12 : i;
    var hour24 = (i < 10) ? ("0"+i) : (""+i);
    var meridian = (i < 12) ? "AM" : "PM";

    MINUTES.forEach(function(min) {
        TIME_OPTIONS.push({
            label: hour+":"+min+" "+meridian,
            value: hour24+":"+min
        });
    });
}
function formatEventId(value) {
    if (!value) {
        return "On enrollment (default)";
    }
    //var events = value.split(',').reverse();
    var string = value.split(',').reverse().map(function(value) {
        if (value === "enrollment") {
            return "on enrollment";
        }
        // events have three parts, e.g. survey:<guid>:finished
        var parts = value.split(":");
        if (parts[0] === "survey") {
            var surveyLabel = surveysOptionsLabelFinder(parts[1]);
            return "when survey '"+surveyLabel+"' is finished";
        } else if (parts[0] === "question") {
            var questionLabel = questionsOptionsLabelFinder(parts[1]);
            var answerValue = parts[2].split("=")[1];
            return "when question '"+questionLabel+"' is answered with value '"+answerValue+"'";
        }
    }).join(', and ');

    return string.charAt(0).toUpperCase() + string.substring(1);
}
function formatTimesArray(times) {
    return (times.length) ? times.map(timeFormatter).join(", ") : "<None>";
}

function collectSurveyOptions(response) {
    response.items.sort(utils.makeFieldSorter("name"));
    surveysOptionsObs.pushAll(response.items.map(function(survey) {
        return {label: survey.name, value: survey.guid, createdOn: survey.createdOn, identifier: survey.identifier};
    }));
}
function collectSurveyQuestions(survey) {
    var options = survey.elements.filter(function(element) {
        // TODO: Once you enable this, you truly can't schedule against un-published surveys, it's annoying.
        // Then again, not as annoying as setting up a schedule that will never fire.
        // Need to consider ways to mitigate this and ensure the UI does update when it's set in the survey editor.
        return (element.type === "SurveyQuestion"/* && element.fireEvent*/);
    }).map(function(question) {
        return {label: survey.name + ": " + question.identifier, value: question.guid };
    });
    questionsOptionsObs.pushAll(options);
}

// TODO: Working on server API to get rid of this 1:N call structure.
serverService.getPublishedSurveys().then(collectSurveyOptions).then(function() {
    surveysOptionsObs().forEach(function(keys) {
        serverService.getSurvey(keys.value, keys.createdOn).then(collectSurveyQuestions);
    });
});

module.exports = {
    formatEventId: formatEventId,
    formatTimesArray: formatTimesArray,
    timeOptions: TIME_OPTIONS,
    timeOptionsLabel: utils.makeOptionLabelFinder(TIME_OPTIONS),
    timeOptionsFinder: utils.makeOptionFinder(TIME_OPTIONS),
    surveysOptionsObs: surveysOptionsObs,
    surveysOptionsLabel: surveysOptionsLabelFinder,
    surveysOptionsFinder: utils.makeOptionFinder(surveysOptionsObs),
    questionsOptionsObs: questionsOptionsObs,
    questionsOptionsLabel: questionsOptionsLabelFinder
};
