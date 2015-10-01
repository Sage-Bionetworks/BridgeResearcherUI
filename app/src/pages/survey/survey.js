var ko = require('knockout');
var serverService = require('../../services/server_service');
var surveyUtils = require('./survey_utils');
var utils = require('../../utils');
var root = require('../../root');
var dragula = require('dragula');

module.exports = function(params) {
    var self = this;

    self.survey = null;
    self.formatDateTime = utils.formatDateTime;
    surveyUtils.initSurveyVM(self);

    // We never disable this editor. include this across the editor
    self.disabledObs = ko.observable(false);

    function loadVM(survey) {
        self.survey = survey;
        surveyUtils.surveyToObservables(self, survey);
        return survey.createdOn;
    }
    function updateVM(keys, message) {
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
    function publish(keys) {
        return serverService.publishSurvey(keys.guid, keys.createdOn);
    }
    function create() {
        surveyUtils.observablesToSurvey(self, self.survey);
        return serverService.createSurvey(self.survey);
    }
    function save() {
        surveyUtils.observablesToSurvey(self, self.survey);
        return serverService.updateSurvey(self.survey);
    }
    function load(keys) {
        return serverService.getSurvey(keys.guid, keys.createdOn).then(loadVM);
    }
   /**
     * Save the thing.
     * @param vm
     * @param event
     */
    self.save = function(vm, event) {
        utils.startHandler(self, event);
        if (self.survey.published) {
            version(self.survey).then(updateVM).then(save)
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
    if (params.guid === "new") {
        loadVM(surveyUtils.newSurvey());
    } else if (params.createdOn) {
        serverService.getSurvey(params.guid, params.createdOn).then(loadVM);
    } else {
        serverService.getSurveyMostRecent(params.guid).then(loadVM);
    }

    var elementsZoneEl = document.querySelector(".elementZone");
    if (!self.publishedObs()) {
        var _item = null;

        dragula([elementsZoneEl], {
            moves: function (el, container, handle) {
                return (handle.className === 'element-draghandle');
            }
        }).on('drop', function(el, zone) {
            var elements = document.querySelectorAll(".elementZone .element");
            // This utility handles node lists
            var index = ko.utils.arrayIndexOf(elements, el);
            var data = ko.contextFor(el).$data;
            self.elementsObs.remove(data);
            self.elementsObs.splice(index,0,data);
            if (_item) {
                _item.parentNode.removeChild(_item);
                _item = null;
            }
        }).on('cloned', function(mirror, item, type) {
            _item = item;
        });
    }
};