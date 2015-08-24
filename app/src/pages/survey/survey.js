var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var $ = require('jquery');

var fields = ['survey','name','createdOn','guid','identifier','published','elements[]'];

module.exports = function(params) {
    var self = this;

    self.messageObs = ko.observable();
    utils.observablesFor(self, fields);

    self.surveyObs({});

    function loadVM(survey) {
        self.surveyObs(survey);
        utils.valuesToObservables(self, survey, fields);
    }

    function updateVM(keys, message) {
        self.surveyObs().guid = keys.guid;
        self.surveyObs().createdOn = keys.createdOn;
        self.surveyObs().version = keys.version;
        // In theory, this should cause the editor to flip from writeable to readonly...
        self.nameObs(self.surveyObs().name);
        self.createdOnObs(self.surveyObs().createdOn);
        self.identifierObs(self.surveyObs().identifier);
        self.publishedObs(self.surveyObs().published);
        if (message) {
            self.messageObs({text: message});
        }
    }

    self.formatDateTime = utils.formatDateTime;

    self.publish = function(vm, event) {
        function version(keys) {
            return serverService.versionSurvey(keys.guid, keys.createdOn).catch(utils.failureHandler(vm, event));
        }
        function publish(keys) {
            return serverService.publishSurvey(keys.guid, keys.createdOn).catch(utils.failureHandler(vm, event));
        }
        function save() {
            return serverService.updateSurvey(self.surveyObs()).catch(utils.failureHandler(vm, event));
        }
        function load(keys) {
            return serverService.getSurvey(keys.guid, keys.createdOn)
                .then(utils.successHandler(vm, event))
                .then(loadVM)
                .then(function(createdOn){
                    self.messageObs({text: "The survey version created on " + self.formatDateTime(lastCreatedOn) + " has been published. A new version has been created for further editing."});
                });
        }
        utils.startHandler(self, event);
        var lastCreatedOn = self.surveyObs().createdOn;
        marshallSurveyForm();
        save().then(publish).then(version).then(load);
    };
    /**
     * Just save the thing.
     * @param vm
     * @param event
     */
    self.save = function(vm, event) {
        utils.startHandler(self, event);
        marshallSurveyForm();

        // REMOVEME
        utils.successHandler(vm, event);
        serverService.updateSurvey(self.surveyObs())
             .then(utils.successHandler(vm, event))
             .then(function(response) {
                updateVM(response, "Survey saved.");
             }).catch(utils.failureHandler(vm, event));
    };
    self.deleteElement = function(params, event) {
        var index = self.elementsObs.indexOf(params.element);
        var element = self.elementsObs()[index];
        if (confirm("Are about to delete question '"+element.identifier+"'.\n\n Are you sure?")) {
            var $element = $(event.target).closest(".element");
            $element.height($element.height()).height(0);
            setTimeout(function() {
                self.elementsObs.remove(element);
                $element.remove();
            },510);
        }
    };

    // This is a complicated process because we're not data binding a lot right now. This may change.
    function marshallSurveyForm() {
        self.surveyObs().name = self.nameObs();
        self.surveyObs().identifier = self.identifierObs();
        // No knockout binding at the moment... there's no reason there couldn't be.
    }

    if (params.createdOn) {
        serverService.getSurvey(params.guid, params.createdOn).then(loadVM);
    } else {
        serverService.getSurveyMostRecent(params.guid).then(loadVM);
    }
};