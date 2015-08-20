var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var $ = require('jquery');

module.exports = function(params) {
    var self = this;

    self.messageObs = ko.observable();
    self.nameObs = ko.observable();
    self.dateObs = ko.observable();
    self.guidObs = ko.observable();
    self.identifierObs = ko.observable();
    self.publishedObs = ko.observable();
    self.elementsObs = ko.observableArray([]);

    function loadVM(survey) {
        console.log(survey);

        survey.elements[1].constraints.type = "DateConstraints";
        survey.elements[1].constraints.earliestValue = "2010-01-01";

        self.survey = survey;
        self.nameObs(survey.name);
        self.dateObs(survey.createdOn);
        self.guidObs(survey.guid);
        self.identifierObs(survey.identifier);
        self.publishedObs(survey.published);
        self.elementsObs.pushAll(survey.elements);
    }

    function updateVM(keys, message) {
        self.survey.guid = keys.guid;
        self.survey.createdOn = keys.createdOn;
        self.survey.version = keys.version;
        self.nameObs(self.survey.name);
        self.identifierObs(self.survey.identifier);
        self.publishedObs(self.survey.published);
        if (message) {
            self.messageObs({text: message});
        }
    }

    self.formatDateTime = utils.formatDateTime;

    self.version = function(vm, event) {
        utils.startHandler(self, event);

        serverService.versionSurvey(self.survey.guid, self.survey.createdOn)
            .then(utils.successHandler(vm, event))
            .then(function(response) {
                self.survey.published = false;
                updateVM(response, "A new survey version has been created.");
            }).catch(utils.failureHandler(vm, event));
    };
    self.publish = function(vm, event) {
        utils.startHandler(self, event);

        serverService.publishSurvey(self.survey.guid, self.survey.createdOn)
            .then(utils.successHandler(vm, event))
            .then(function(response) {
                self.survey.published = true;
                updateVM(response, "Survey has been published.");
            }).catch(utils.failureHandler(vm, event));
    };
    self.save = function(vm, event) {
        utils.startHandler(self, event);
        marshallSurveyForm();

        console.log(JSON.stringify(self.survey));
        utils.successHandler(vm, event);
        /*
        serverService.updateSurvey(self.survey)
            .then(utils.successHandler(vm, event))
            .then(function(response) {
                updateVM(response, "Survey saved.");
            }).catch(utils.failureHandler(vm, event));
        */
    };

    self.deleteElement = function(element, event) {
        if (confirm("Are about to delete question '"+element.identifier+"'.\n\n Are you sure?")) {
            // Yes, this is gorpy. Should use a binding
            var $element = $(event.target).closest(".element").css({'transform':'scaleY(0)'});
            setTimeout(function() {
                $element.remove();
                var index = self.survey.elements.indexOf(element);
                self.survey.elements.splice(index,1);
                self.elementsObs.remove(element);
            },550);
        }
    };

    // This is a complicated process because we're not data binding a lot right now. This may change.
    function marshallSurveyForm() {
        self.survey.name = self.nameObs();
        self.survey.identifier = self.identifierObs();
        // No knockout binding at the moment... there's no reason there couldn't be.
    }

    serverService.getSurvey(params.guid, params.createdOn).then(loadVM);
};