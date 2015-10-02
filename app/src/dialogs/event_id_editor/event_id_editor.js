var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');
var surveyUtils = require('../../pages/survey/survey_utils');
var root = require('../../root');

var OBJECT_TYPE = Object.freeze([
    {value: 'survey', label: 'When survey'},
    {value: 'question', label: 'When question'}
]);

module.exports = function(params) {
    var self = this;

    self.clearEventIdFunc = params.clearEventIdFunc;
    self.publishedObs = ko.observable(false);
    self.eventIdObs = params.eventIdObs;
    self.answerObs = ko.observable();
    self.enrollmentObs = ko.observable(false);

    self.objectTypeObs = ko.observable(OBJECT_TYPE[0].value);
    self.objectTypeOptions = OBJECT_TYPE;
    self.objectTypeLabel = utils.makeOptionLabelFinder(OBJECT_TYPE);
    self.objectTypeObs.subscribe(function(newValue) {
        if (newValue === "question") {
            root.message('warning', 'To schedule against a question, check the question\'s "fireEvent" checkbox and be sure to publish that version of the survey.');
        }
    });

    self.surveyObs = ko.observable();
    self.surveysOptionsObs = surveyUtils.surveysOptionsObs;
    self.surveysLabel = surveyUtils.surveysOptionsLabel;

    self.questionObs = ko.observable();
    self.questionsOptionsObs = surveyUtils.questionsOptionsObs;
    self.questionsLabel = surveyUtils.questionsOptionsLabel

    surveyUtils.triggerSurveyRefresh().then(function() {
        self.eventIdObs().split(",").forEach(function(eventId) {
            if (eventId === "enrollment") {
                self.enrollmentObs(true);
            } else {
                var parts = eventId.split(":");
                if (parts[0] === "question") {
                    self.objectTypeObs("question");
                    self.questionObs(parts[1]);
                    self.answerObs(parts[2].replace("answered=",""));
                } else if (parts[0] === "survey") {
                    self.objectTypeObs("survey");
                    self.surveyObs(parts[1]);
                }
            }
        });
    });

    self.save = function() {
        var eventId = self.objectTypeObs() + ":";
        if (eventId === "question:" && !self.answerObs()) {
            root.message('error', 'An answer is required.');
            return;
        }
        if (eventId === "question:") {
            eventId += self.questionObs() + ":answered=" + self.answerObs();
        } else if (eventId === "survey:") {
            eventId += self.surveyObs() + ":finished";
        }
        if (self.enrollmentObs()) {
            eventId += ",enrollment";
        }
        self.eventIdObs(eventId);
        root.closeDialog();
    };
    self.clear = function(vm, event) {
        self.clearEventIdFunc(vm, event);
        root.closeDialog();
    };
    self.cancel = function() {
        root.closeDialog();
    };
}