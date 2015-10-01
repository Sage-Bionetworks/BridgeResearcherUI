var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');
var surveyUtils = require('../../pages/survey/survey_utils');
var root = require('../../root');

var OBJECT_TYPE = Object.freeze([
    {value: 'survey', label: 'When survey'},
    {value: 'question', label: 'When question'}/*,
    {value: 'task', label: 'When task'} actually the server doesn't support this */
]);

module.exports = function(params) {
    var self = this;

    self.clearEventIdFunc = params.clearEventIdFunc;
    self.publishedObs = ko.observable(false);
    self.eventIdObs = params.eventIdObs;
    self.answerObs = ko.observable();
    self.enrollmentObs = ko.observable(true);

    self.objectTypeObs = ko.observable(OBJECT_TYPE[0].value);
    self.objectTypeOptions = OBJECT_TYPE;
    self.objectTypeLabel = utils.makeOptionLabelFinder(OBJECT_TYPE);
    self.objectTypeObs.subscribe(function(newValue) {
        if (newValue === "question") {
            utils.message('warning', 'To schedule against a question, check the "fireEvent" checkbox for that question in the survey editor.');
        }
    });

    self.surveyObs = ko.observable();
    self.surveysOptionsObs = surveyUtils.surveysOptionsObs;
    self.surveysLabel = surveyUtils.surveysOptionsLabel;

    self.questionObs = ko.observable();
    self.questionsOptionsObs = surveyUtils.questionsOptionsObs;
    self.questionsLabel = surveyUtils.questionsOptionsLabel

    self.save = function() {
        var eventId = self.objectTypeObs() + ":";
        if (eventId === "question:" && !self.answerObs()) {
            utils.message('error', 'An answer is required.');
            return;
        }
        var eventId = self.objectTypeObs() + ":";
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