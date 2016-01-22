var ko = require('knockout');
require('knockout-postbox');
var serverService = require('../../services/server_service');
var surveyUtils = require('./survey_utils');
var utils = require('../../utils');
var root = require('../../root');

module.exports = function(params) {
    var self = this;

    self.isLoaded = ko.observable(false);
    self.survey = null;
    self.formatDateTime = utils.formatDateTime;
    surveyUtils.initSurveyVM(self);

    // Only one is neededed
    var scrollTo = utils.makeScrollTo(".element");

    function loadVM(survey) {
        console.log("loadVM", survey);
        self.survey = survey;
        surveyUtils.surveyToObservables(self, survey);
        root.setEditorPanel('SurveyPanel', {viewModel:self});
        self.isLoaded(true);
        return survey.createdOn;
    }
    function updateVM(keys, message) {
        console.log("updateVM", keys, message);
        self.survey.guid = keys.guid;
        self.survey.createdOn = keys.createdOn;
        self.survey.version = keys.version;
        self.guidObs(keys.guid);
        self.createdOnObs(keys.createdOn);
        self.versionObs(keys.version);
        self.isLoaded(true);
        if (message) {
            root.message('success', message);
        }
    }
    function version(keys) {
        return serverService.versionSurvey(keys.guid, keys.createdOn);
    }
    function create() {
        surveyUtils.observablesToSurvey(self, self.survey);
        return serverService.createSurvey(self.survey);
    }
    function save() {
        surveyUtils.observablesToSurvey(self, self.survey);
        return serverService.updateSurvey(self.survey);
    }

    self.createNewElement = function(vm, event) {
        var type = event.target.getAttribute("data-type");
        var el = surveyUtils.newField(type);
        self.elementsObs.push(el);
        var index = self.elementsObs().length-1;

        scrollTo(index);
    };
    self.createElementAfter = function(element, event) {
        var type = event.target.getAttribute("data-type");
        var index = self.elementsObs.indexOf(element);

        var el = surveyUtils.newField(type);
        self.elementsObs.splice(index+1,0,el);

        scrollTo(index+1);
    };
    self.copyElement = function(element) {
        var index = self.elementsObs.indexOf(element);
        surveyUtils.observablesToElement(element);

        var newElement = JSON.parse(JSON.stringify(element));
        surveyUtils.elementToObservables(newElement);
        self.elementsObs.splice(index+1, 0, newElement);
        scrollTo(index+1);
    };
    self.deleteElement = function(element) {
        if (confirm("Are you sure?")) {
            var index = self.elementsObs.indexOf(element);
            self.elementsObs.remove(element);

            if (self.elementsObs().length > 0) {
                scrollTo(index);
            }
        }
    };
    self.fadeUp = function(div, index, element) {
        if (div.nodeType === 1) {
            $(div).slideUp(function() {
                $(div).remove();
                setTimeout(function() {
                    if (self.elementsObs().length > 0) {
                        scrollTo(index);
                    }
                },1);
            });
        }
    };
    ko.postbox.subscribe("elementsRemove", self.deleteElement);
    ko.postbox.subscribe("elementsSelect", function(element) {
        var index = self.elementsObs().indexOf(element);
        scrollTo( index );
    });

    /**
     * Save the thing.
     * @param vm
     * @param event
     */
    self.save = function(vm, event) {
        utils.startHandler(self, event);

        if (self.survey.published) {
            version(self.survey).then(updateVM).then(save).then(updateVM)
                .then(function() {
                    self.publishedObs(false);
                    self.survey.published = false;
                })
                .then(utils.successHandler(vm, event, "New version of survey saved."))
                .catch(utils.failureHandler(vm, event));
        } else if (self.survey.guid) {
            save().then(updateVM)
                .then(utils.successHandler(vm, event, "Survey saved."))
                .catch(utils.failureHandler(vm, event));
        } else {
            create().then(updateVM)
                .then(utils.successHandler(vm, event, "Survey created."))
                .catch(utils.failureHandler(vm, event));
        }

    };

    var notFoundHandler = utils.notFoundHandler(self, "Survey not found", "#/surveys");

    if (params.guid === "new") {
        loadVM(surveyUtils.newSurvey());
    } else if (params.createdOn) {
        serverService.getSurvey(params.guid, params.createdOn).then(loadVM).catch(notFoundHandler);
    } else {
        serverService.getSurveyMostRecent(params.guid).then(loadVM).catch(notFoundHandler);
    }
};