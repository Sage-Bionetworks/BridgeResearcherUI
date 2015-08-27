var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var $ = require('jquery');
var dragula = require('dragula');

function surveyMarshaller(survey) {
    return function(vm) {
        survey.name = vm.nameObs();
        survey.createdOn = vm.createdOnObs();
        survey.guid = vm.guidObs();
        survey.identifier = vm.identifierObs();
        survey.published = vm.publishedObs();
        survey.version = vm.versionObs();
        // Does this update survey.elements? By my understanding, it does.
        survey.elements = vm.elementsObs().map(function (element) {
            var con = element.constraints;
            if (con) {
                if (con.enumerationObs) {
                    con.enumeration = con.enumerationObs();
                }
                if (con.rulesObs) {
                    con.rules = con.rulesObs();
                }
            }
            return element;
        });
        return survey;
    };
}

module.exports = function(params) {
    var self = this;

    self.marshaller = null;

    self.messageObs = ko.observable();
    self.nameObs = ko.observable("");
    self.createdOnObs = ko.observable("");
    self.guidObs = ko.observable("");
    self.identifierObs = ko.observable("");
    self.publishedObs = ko.observable("");
    self.versionObs = ko.observable("");
    self.elementsObs = ko.observableArray([]);

    function loadVM(survey) {
        self.marshaller = surveyMarshaller(survey);
        self.nameObs(survey.name);
        self.createdOnObs(survey.createdOn);
        self.guidObs(survey.guid);
        self.identifierObs(survey.identifier);
        self.publishedObs(survey.published);
        self.versionObs(survey.version);
        var elements = survey.elements.map(function(element) {
            var con = element.constraints;
            if (con && con.enumeration) {
                con.enumerationObs = ko.observableArray(con.enumeration);
            }
            return element;
        });
        self.elementsObs.pushAll(elements);
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

    self.formatDateTime = utils.formatDateTime;

    self.publish = function(vm, event) {
        function version(keys) {
            return serverService.versionSurvey(keys.guid, keys.createdOn).catch(utils.failureHandler(vm, event));
        }
        function publish(keys) {
            return serverService.publishSurvey(keys.guid, keys.createdOn).catch(utils.failureHandler(vm, event));
        }
        function save() {
            var survey = self.marshaller(self);
            return serverService.updateSurvey(survey).catch(utils.failureHandler(vm, event));
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
        var survey = self.marshaller(self);

        serverService.updateSurvey(survey)
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

    if (params.createdOn) {
        serverService.getSurvey(params.guid, params.createdOn).then(loadVM);
    } else {
        serverService.getSurveyMostRecent(params.guid).then(loadVM);
    }


    var elementsZoneEl = document.querySelector(".elementZone");
    if (!self.publishedObs()) {
        var _item = null;
        dragula([elementsZoneEl]).on('drop', function(el, zone) {
            // This utility handles node lists
            var index = ko.utils.arrayIndexOf(el.parentNode.children, el);
            var data = ko.contextFor(el).$data;
            self.elementsObs.remove(data);
            self.elementsObs.splice(index,0,data);
        }).on('cloned', function(mirror, item, type) {
            _item = item;
        }).on('drop', function() {
            if (_item) {
                _item.parentNode.removeChild(_item);
                _item = null;
            }
        });
    }

};