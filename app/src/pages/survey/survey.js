var ko = require('knockout');
var serverService = require('../../services/server_service');
var surveyUtils = require('./survey_utils');
var utils = require('../../utils');
var $ = require('jquery');
var dragula = require('dragula');

module.exports = function(params) {
    var self = this;

    self.survey = null;
    self.messageObs = ko.observable();
    self.formatDateTime = utils.formatDateTime;
    surveyUtils.initSurveyVM(self);

    function loadVM(survey) {
        self.survey = survey;
        surveyUtils.surveyToObservables(self, survey);
        return survey.createdOn;
    }

    function updateVM(keys, message) {
        self.guidObs(keys.guid);
        self.createdOnObs(keys.createdOn);
        self.versionObs(keys.version);
        if (message) {
            self.messageObs({text: message});
        }
    }

    self.publish = function(vm, event) {
        function version(keys) {
            return serverService.versionSurvey(keys.guid, keys.createdOn).catch(utils.failureHandler(vm, event));
        }
        function publish(keys) {
            return serverService.publishSurvey(keys.guid, keys.createdOn).catch(utils.failureHandler(vm, event));
        }
        function save() {
            surveyUtils.observablesToSurvey(self, self.survey);
            return serverService.updateSurvey(self.survey).catch(utils.failureHandler(vm, event));
        }
        function load(keys) {
            return serverService.getSurvey(keys.guid, keys.createdOn)
                .then(utils.successHandler(vm, event))
                .then(loadVM)
                .then(function(){
                    self.messageObs({text: "The survey version created on " + self.formatDateTime(lastCreatedOn) +
                        " has been published. A new version has been created for further editing."});
                });
        }
        utils.startHandler(self, event);
        var lastCreatedOn = self.createdOnObs();
        save().then(publish).then(version).then(load);
    };
    /**
     * Just save the thing.
     * @param vm
     * @param event
     */
    self.save = function(vm, event) {
        utils.startHandler(self, event);
        surveyUtils.observablesToSurvey(self, self.survey);
        console.log(JSON.stringify(self.survey));

        if (self.survey.guid) {
            serverService.updateSurvey(self.survey)
                .then(utils.successHandler(vm, event))
                .then(function(response) {
                    updateVM(response, "Survey saved.");
                }).catch(utils.failureHandler(vm, event));
        } else {
            serverService.createSurvey(self.survey)
                .then(utils.successHandler(vm, event))
                .then(function(response) {
                    updateVM(response, "Survey created.");
                }).catch(utils.failureHandler(vm, event));
        }

    };
    self.deleteElement = function(params, event) {
        var index = self.elementsObs.indexOf(params.element);
        var element = self.elementsObs()[index];
        var id = element.identifierObs() || "<none>";
        if (confirm("You are about to delete question '"+id+"'.\n\n Are you sure?")) {
            var $element = $(event.target).closest(".element");

            $element.css("max-height","0px");
            setTimeout(function() {
                self.elementsObs.remove(element);
                $element.remove();
            },510); // waiting for animation to complete
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