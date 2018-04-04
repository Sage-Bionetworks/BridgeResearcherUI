import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import surveyUtils from './survey_utils';
import utils from '../../utils';

const notFound = utils.failureHandler({
    redirectTo: "surveys",
    redirectMsg: "Survey not found."
});

module.exports = function(params) {
    let self = this;

    new Binder(self)
        .obs('createdOn', params.createdOn)
        .obs('guid', params.guid)
        .obs('isLoaded', false);

    self.survey = null;
    self.formatDateTime = fn.formatDateTime;
    surveyUtils.initSurveyVM(self);

    // Only one is needed
    let scrollTo = utils.makeScrollTo(".element");
    self.fadeUp = utils.fadeUp();

    function loadVM(survey) {
        self.survey = survey;
        surveyUtils.surveyToObservables(self, survey);
        root.setEditorPanel('SurveyPanel', {viewModel:self});
        self.isLoadedObs(true);
        return survey.createdOn;
    }
    function updateVM(keys, message) {
        self.survey.guid = keys.guid;
        self.survey.createdOn = keys.createdOn;
        self.survey.version = keys.version;
        self.guidObs(keys.guid);
        self.createdOnObs(keys.createdOn);
        self.versionObs(keys.version);
        self.isLoadedObs(true);
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
        let type = event.target.getAttribute("data-type");
        let el = surveyUtils.newField(type);
        self.elementsObs.push(el);
        let index = self.elementsObs().length-1;
        self.selectedElementObs(index);
    };
    self.createElementAfter = function(element, event) {
        let index = self.elementsObs.indexOf(element);
        let el = surveyUtils.newField("MultiValueConstraints");
        self.elementsObs.splice(index+1,0,el);
        self.selectedElementObs(index+1);
    };
    self.selectElement = function(data, event) {
        let index = self.elementsObs().indexOf(data);
        self.selectedElementObs(index);
    };
    self.deleteElement = utils.animatedDeleter(scrollTo, self.elementsObs, self.selectedElementObs);

    self.changeElementType = function(domEl) {
        let index = ko.contextFor(domEl).$index();
        let oldElement = self.elementsObs()[index];
        let newType = domEl.getAttribute("data-type");

        let newElement = surveyUtils.changeElementType(oldElement, newType);
        if (newType !== oldElement.type) {
            self.elementsObs.splice(index, 1, newElement);
        }
        scrollTo(index);
    };
    self.copyElement = function(element) {
        let index = self.elementsObs.indexOf(element);
        surveyUtils.observablesToElement(element);

        let newElement = JSON.parse(JSON.stringify(element));
        delete newElement.guid;
        delete newElement.identifier;
        if (newElement.type === "SurveyInfoScreen") {
            newElement.title = "[Copy] " + newElement.title;
        } else {
            newElement.prompt = "[Copy] " + newElement.prompt;
        }
        newElement.identifier = fn.incrementNumber(newElement.identifier);
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
                .catch(utils.failureHandler());
        } else if (self.survey.guid) {
            save().then(updateVM)
                .then(utils.successHandler(vm, event, "Survey saved."))
                .catch(utils.failureHandler());
        } else {
            create().then(updateVM)
                .then(utils.successHandler(vm, event, "Survey created."))
                .catch(utils.failureHandler());
        }
    };

    if (params.guid === "new") {
        loadVM(surveyUtils.newSurvey());
    } else if (params.createdOn) {
        serverService.getSurvey(params.guid, params.createdOn)
            .then(loadVM)
            .catch(notFound);
    } else {
        serverService.getSurveyMostRecent(params.guid)
            .then(loadVM)
            .catch(notFound);
    }
};
module.exports.prototype.dispose = function() {
    this.titleObs.dispose();
};