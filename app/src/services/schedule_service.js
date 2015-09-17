var ko = require('knockout');
var utils = require('../utils');
var serverService = require('./server_service');

// TODO: Ick, clean this up.

var SCHEDULE_TYPE_OPTIONS = Object.freeze([
    {value: 'once', label: 'Once'},
    {value: 'recurring', label: 'Recurring'}
]);
function nameSorter(a,b) {
    return a.name.toLowerCase() > b.name.toLowerCase();
}
function makeFinder(obs) {
    return function(value) {
        for (var i= 0; i < obs().length; i++) {
            var option = obs()[i];
            if (option.value === value) {
                return option.label;
            }
        }
        return "";
    };
}
function formatEventId(value) {
    if (!value) {
        return "On enrollment (default)";
    }
    var events = value.split(',').reverse();
    var string = events.map(function(value) {
        if (value === "enrollment") {
            return "on enrollment";
        }
        var parts = value.split(":");
        if (parts[0] === "survey") {
            var surveyLabel = makeFinder(surveysOptionsObs)(parts[1]);
            return "when survey '" + surveyLabel + "' is finished";
        } else if (parts[0] === "question") {
            var qLabel = makeFinder(questionsOptionsObs)(parts[1]);
            return "when question '" + qLabel + "' is answered with value '" + parts[2].split("=")[1] + "'";
        }
    }).join(', and ');
    return string.charAt(0).toUpperCase() + string.substring(1);
}

var surveysOptionsObs = ko.observableArray([]);
var questionsOptionsObs = ko.observableArray([]);

serverService.getPublishedSurveys().then(function(response) {
    response.items.sort(nameSorter);
    surveysOptionsObs.pushAll(response.items.map(function(survey) {
        return {label: survey.name, value: survey.guid, createdOn: survey.createdOn, identifier: survey.identifier};
    }));
}).then(function() {
    // Wasn't that fun? That was fun. But this is even more fun: find all the questions in all the surveys...
    surveysOptionsObs().forEach(function(keys) {
        serverService.getSurvey(keys.value, keys.createdOn).then(function(survey) {
            var options = survey.elements.filter(function(element) {
                return (element.type === "SurveyQuestion");
            }).map(function(question) {
                return {label: keys.label + ": " + question.identifier, value: question.guid };
            });
            questionsOptionsObs.pushAll(options);
        });
    });
});

var TIME_OPTIONS = [];
var MINUTES = ["00","30"];

for (var i=0; i < 24; i++) {
    var hour = (i > 12) ? (i-12) : i;
    hour = (hour < 10) ? ("0"+hour) : (""+hour);

    var hour24 = (i < 10) ? ("0"+i) : (""+i);
    var meridian = (i < 12) ? "AM" : "PM";
    MINUTES.forEach(function(min) {
        var label = hour+":"+min+" "+meridian;
        var timeOfDay= hour24+":"+min;
        TIME_OPTIONS.push({label: label, value: timeOfDay});
    });
}
// I think these are just idiomatic.
TIME_OPTIONS.shift();
TIME_OPTIONS.shift();
TIME_OPTIONS.unshift({label: "12:30 AM", value: "00:30"});
TIME_OPTIONS.push({label: "12:00 PM", value: "00:00"});

function findTimeOptionByValue(value) {
    for (var i= 0, len = TIME_OPTIONS.length; i < len; i++) {
        if (TIME_OPTIONS[i].value === value) {
            return TIME_OPTIONS[i];
        }
    }
    return {label:"", value:""};
}
function formatTimesArray(times) {
    return (times.length) ? times.map(formatTime).join(", ") : "<None>";
}
function formatTime(time) {
    return findTimeOptionByValue(time).label;
}
function getSurveyIdentifierWithGuid(guid) {
    var options = surveysOptionsObs();
    for (var i= 0, len = options.length; i < len; i++) {
        if (options[i].value === guid) {
            return options[i];
        }
    }
    return null;
}

module.exports = {
    makeObserverFinder: makeFinder,
    formatEventId: formatEventId,
    surveysOptionsObs: surveysOptionsObs,
    questionsOptionsObs: questionsOptionsObs,
    surveysOptionsLabel: makeFinder(surveysOptionsObs),
    questionsOptionsLabel: makeFinder(questionsOptionsObs),
    timeOptions: TIME_OPTIONS,
    timeOptionsLabel: utils.makeFinderByLabel(TIME_OPTIONS),
    findTimeOptionByValue: findTimeOptionByValue,
    formatTime: formatTime,
    formatTimesArray: formatTimesArray,
    getSurveyIdentifierWithGuid: getSurveyIdentifierWithGuid
};