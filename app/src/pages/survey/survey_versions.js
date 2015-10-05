var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

function addCheckedObs(item) {
    item.checkedObs = ko.observable(false);
    return item;
}

module.exports = function(params) {
    var self = this;
    self.keys = params;

    self.formatDateTime = utils.formatDateTime;
    self.guidObs = ko.observable(params.guid);
    self.createdOnObs = ko.observable(params.createdOn);
    self.publishedObs = ko.observable(false);
    self.nameObs = ko.observable();

    self.itemsObs = ko.observableArray([]);
    // self.showVersionObs = ko.observable(false); unused?
    self.selectedObs = ko.observable(null);

    self.disablePublish = ko.computed(function() {
        return self.selectedObs() === null || self.selectedObs().published;
    });
    self.disableDelete = ko.computed(function() {
        // Cannot delete the last published item in the table
        var pubCount = self.itemsObs().filter(function(item) {
            return item.published;
        }).length;
        return (self.selectedObs() === null) || self.selectedObs().published && pubCount === 1;
    });

    self.selectForAction = function(vm, event) {
        var survey = ko.dataFor(event.target);
        self.itemsObs().forEach(function(item) {
            if (item !== survey) {
                item.checkedObs(false);
            } else if (item === survey && !item.checkedObs()) {
                item.checkedObs(true);
            }
        });
        self.selectedObs(survey);
        return true;
    };
    self.deleteSurvey = function(vm, event) {
        var survey = self.selectedObs();
        if (survey !== null) {
            if (confirm("Are you sure you want to delete this survey version?")) {
                utils.startHandler(self, event);
                serverService.deleteSurvey(survey)
                    .then(load)
                    .then(utils.makeTableRowHandler(vm, [survey], "#/surveys"))
                    .then(utils.successHandler(vm, event, "Survey version deleted."))
                    .catch(utils.failureHandler(vm, event));
            }
        }
    }
    self.publish = function(vm, event) {
        var survey = self.selectedObs();
        if (survey !== null) {
            utils.startHandler(self, event);
            serverService.publishSurvey(survey.guid, survey.createdOn)
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
            serverService.getSurveyAllRevisions(params.guid).then(function(list) {
                self.itemsObs(list.items.map(function(survey) {
                    survey.checkedObs = ko.observable(false);
                    return survey;
                }));
            });
        }).catch(utils.notFoundHandler(self, "Survey not found."));
        /*

        var matchDate = (typeof params.createdOn !== "string") ?
            params.createdOn.toISOString() : params.createdOn;
        return survey.createdOn;
        */
    }
    load(params);
};