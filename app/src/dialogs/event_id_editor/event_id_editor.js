var ko = require('knockout');
var utils = require('../../utils');
var optionsService = require('./../../services/options_service');
var root = require('../../root');
var UNARY_EVENTS = require('../../pages/schedule/schedule_utils').UNARY_EVENTS;

var OBJECT_TYPE = Object.freeze([
        /*
    {value: 'survey', label: 'When survey'},
    {value: 'question', label: 'When question'},*/
    {value: 'activity', label: 'When activity'}
]);

module.exports = function(params) {
    var self = this;

    var originalValue = params.eventIdObs();

    self.clearEventIdFunc = params.clearEventIdFunc;
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
    self.surveysOptionsObs = ko.observableArray([]);
    self.surveysLabel = utils.makeOptionLabelFinder(self.surveysOptionsObs);
    optionsService.getSurveyOptions().then(self.surveysOptionsObs);

    self.questionObs = ko.observable();
    self.questionsOptionsObs = ko.observableArray([]);
    self.questionsLabel = utils.makeOptionLabelFinder(self.questionsOptionsObs);
    // Very expensive to initialize the question options, which are currently hidden.
    // optionsService.getQuestionOptions().then(self.questionsOptionsObs);

    self.activityObs = ko.observable();
    self.activityOptionsObs = ko.observableArray([]);
    self.activityLabel = utils.makeOptionLabelFinder(self.activityOptionsObs);
    optionsService.getActivityOptions().then(self.activityOptionsObs);

    self.advancedEditorObs = ko.observable(false);

    if (self.eventIdObs()) {
        self.eventIdObs().split(",").forEach(function(eventId) {
            if (Object.keys(UNARY_EVENTS).indexOf(eventId) > -1 && eventId !== "enrollment") {
                self.eventIdObs(eventId);
                self.advancedEditorObs(true);
                return;
            }
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
                } else if (parts[0] === "activity") {
                    self.objectTypeObs("activity");
                    self.activityObs(parts[1]);
                }
            }
        });
    }

    self.saveAndCloseDialog = function() {
        var eventId = self.objectTypeObs() + ":";
        if (eventId === "question:" && !self.answerObs()) {
            root.message('error', 'An answer is required.');
            return;
        }
        if (eventId === "question:") {
            eventId += self.questionObs() + ":answered=" + self.answerObs();
        } else if (eventId === "survey:") {
            eventId += self.surveyObs() + ":finished";
        } else if (eventId === "activity:") {
            eventId += self.activityObs() + ":finished";
        }
        if (self.enrollmentObs()) {
            eventId += ",enrollment";
        }
        self.eventIdObs(eventId);
        root.closeDialog();
    };
    self.showAdvanced = function(vm, event) {
        self.advancedEditorObs(true);
    };
    self.clearAndCloseDialog = function(vm, event) {
        self.clearEventIdFunc(vm, event);
        root.closeDialog();
    };
    self.closeDialog = function() {
        root.closeDialog();
    };
    self.resetAndCloseDialog = function(vm, event) {
        self.eventIdObs(originalValue);
        root.closeDialog();
    };

}