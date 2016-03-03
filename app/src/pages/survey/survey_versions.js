var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

module.exports = function(params) {
    var self = this;
    self.keys = params;

    self.formatDateTime = utils.formatDateTime;
    self.guidObs = ko.observable(params.guid);
    self.createdOnObs = ko.observable(params.createdOn);
    self.publishedObs = ko.observable(false);
    self.nameObs = ko.observable();

    self.itemsObs = ko.observableArray([]);
    self.selectedObs = ko.observable(null);

    // redirect, you just deleted the record you last loaded in the tabset.
    function redirectIfDeleteSelf(thisSurvey) {
        return function(response) {
            if (thisSurvey.createdOn === new Date(params.createdOn).toISOString()) {
                document.location = "#/surveys";
            }
            return response;
        };
    }

    self.deleteSurvey = function(vm, event) {
        if (confirm("Are you sure you want to delete this survey version?")) {
            utils.startHandler(self, event);
            serverService.deleteSurvey(vm)
                .then(load)
                .then(utils.makeTableRowHandler(vm, [vm], "#/surveys"))
                .then(redirectIfDeleteSelf(survey))
                .then(utils.successHandler(vm, event, "Survey version deleted."))
                .catch(utils.failureHandler(vm, event));
        }
    }
    self.publish = function(vm, event) {
        if (confirm("Are you sure you want to publish this survey version?")) {
            utils.startHandler(self, event);
            serverService.publishSurvey(vm.guid, vm.createdOn)
                .then(load)
                .then(utils.successHandler(vm, event, "Survey has been published."))
                .catch(utils.failureHandler(vm, event));
        }
    };
    function load(survey) {
        // This is faster than it looks because of client-side caching
        serverService.getSurvey(params.guid, params.createdOn).then(function(survey) {
            self.nameObs(survey.name);
            self.publishedObs(survey.published);
            self.createdOnObs(survey.createdOn);
            serverService.getSurveyAllRevisions(params.guid).then(function(list) {
                self.itemsObs(list.items.map(function(survey) {
                    return survey;
                }));
            });
        }).catch(utils.notFoundHandler(self, "Survey not found."));
    }
    load(params);
};