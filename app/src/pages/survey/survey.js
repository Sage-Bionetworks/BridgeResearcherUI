var ko = require('knockout');
var serverService = require('../../services/server_service');
var surveyUtils = require('./survey_utils');
var utils = require('../../utils');
var fn = require('../../transforms');
var root = require('../../root');

module.exports = function(params) {
    var self = this;

    self.isLoaded = ko.observable(false);
    self.survey = null;
    self.formatDateTime = fn.formatLocalDateTime;
    surveyUtils.initSurveyVM(self);

    // Only one is needed
    var scrollTo = utils.makeScrollTo(".element");
    self.fadeUp = utils.fadeUp();

    function loadVM(survey) {
        self.survey = survey;
        surveyUtils.surveyToObservables(self, survey);
        root.setEditorPanel('SurveyPanel', {viewModel:self});
        self.isLoaded(true);
        return survey.createdOn;
    }
    function updateVM(keys, message) {
        self.survey.guid = keys.guid;
        self.survey.createdOn = keys.createdOn;
        self.survey.version = keys.version;
        self.guidObs(keys.guid);
        self.createdOnObs(keys.createdOn);
        self.versionObs(keys.version);
        self.isLoaded(true);
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
    function unpublish() {
        self.publishedObs(false);
        self.survey.published = false;
    }

    self.createNewElement = function(vm, event) {
        var type = event.target.getAttribute("data-type");
        var el = surveyUtils.newField(type);
        self.elementsObs.push(el);
        var index = self.elementsObs().length-1;
        self.selectedElementObs(index);
    };
    self.createElementAfter = function(element, event) {
        var index = self.elementsObs.indexOf(element);
        var el = surveyUtils.newField("MultiValueConstraints");
        self.elementsObs.splice(index+1,0,el);
        self.selectedElementObs(index+1);
    };
    self.selectElement = function(data, event) {
        var index = self.elementsObs().indexOf(data);
        self.selectedElementObs(index);
    };
    self.deleteElement = utils.animatedDeleter(scrollTo, self.elementsObs, self.selectedElementObs);

    self.changeElementType = function(domEl) {
        var index = ko.contextFor(domEl).$index();
        var oldElement = self.elementsObs()[index];
        var newType = domEl.getAttribute("data-type");

        var newElement = surveyUtils.changeElementType(oldElement, newType);
        if (newType !== oldElement.type) {
            self.elementsObs.splice(index, 1, newElement);
        }
    };
    self.copyElement = function(element) {
        var index = self.elementsObs.indexOf(element);
        surveyUtils.observablesToElement(element);

        var newElement = JSON.parse(JSON.stringify(element));
        surveyUtils.elementToObservables(newElement);
        self.elementsObs.splice(index+1, 0, newElement);
        scrollTo(index+1);
    };
    self.selectedElementObs.subscribe(function(index) {
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
            version(self.survey).then(updateVM)
                .then(save)
                .then(updateVM)
                .then(unpublish)
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

    if (params.guid === "new") {
        loadVM(surveyUtils.newSurvey());
    } else if (params.createdOn) {
        serverService.getSurvey(params.guid, params.createdOn)
            .then(loadVM)
            .catch(utils.notFoundHandler("Survey", "surveys"));
    } else {
        serverService.getSurveyMostRecent(params.guid)
            .then(loadVM)
            .catch(utils.notFoundHandler("Survey", "surveys"));
    }
};