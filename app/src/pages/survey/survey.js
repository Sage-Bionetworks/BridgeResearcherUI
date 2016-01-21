var ko = require('knockout');
require('knockout-postbox');
var serverService = require('../../services/server_service');
var surveyUtils = require('./survey_utils');
var utils = require('../../utils');
var root = require('../../root');

module.exports = function(params) {
    var self = this;

    self.survey = null;
    self.formatDateTime = utils.formatDateTime;
    surveyUtils.initSurveyVM(self);

    self.create = surveyUtils.makeCreate(self.elementsObs, function() { return -1; });

    function loadVM(survey) {
        console.log("loadVM", survey);
        self.survey = survey;
        surveyUtils.surveyToObservables(self, survey);
        root.setEditorPanel('SurveyPanel', {viewModel:self});
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

    var scrollTo = utils.makeScrollTo(".element");

    self.addGroup = function(vm, event) {
        self.elementsObs.push(surveyUtils.newField('SurveyQuestion'));
        scrollTo(self.elementsObs().length-1);
    };
    ko.postbox.subscribe("elementsAdd", function() {
        self.addGroup();
    });
    ko.postbox.subscribe("elementsRemove",
            utils.manualFadeRemove(self.elementsObs, ".survey .element"));
    ko.postbox.subscribe("elementsSelect", function(element) {
        var index = self.elementsObs().indexOf(element);
        scrollTo( index );
    });

    var notFoundHandler = utils.notFoundHandler(self, "Survey not found", "#/surveys");

    if (params.guid === "new") {
        loadVM(surveyUtils.newSurvey());
    } else if (params.createdOn) {
        serverService.getSurvey(params.guid, params.createdOn).then(loadVM).catch(notFoundHandler);
    } else {
        serverService.getSurveyMostRecent(params.guid).then(loadVM).catch(notFoundHandler);
    }
};