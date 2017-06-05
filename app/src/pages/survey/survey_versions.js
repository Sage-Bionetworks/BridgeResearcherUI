var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');
var fn = require('../../functions');
var alerts = require('../../widgets/alerts');
var tables = require('../../tables');

module.exports = function(params) {
    var self = this;
    self.keys = params;

    self.formatDateTime = fn.formatDateTime;
    
    var binder = bind(self)
        .obs('guid', params.guid)
        .obs('createdOn', params.createdOn)
        .obs('published', false)
        .obs('items[]', [])
        .obs('selected', null)
        .obs('name');

    tables.prepareTable(self, {name:'survey version'});

    // redirect, you just deleted the record you last loaded in the tabset.
    function redirectIfDeleteSelf(thisSurvey) {
        return function(response) {
            if (thisSurvey.createdOn === new Date(params.createdOn).toISOString()) {
                document.location = "#/surveys";
            }
            return response;
        };
    }

    self.deleteSurvey = function(survey, event) {
        alerts.deleteConfirmation("Are you sure you want to delete this survey version?", function() {
            utils.startHandler(self, event);
            serverService.deleteSurvey(survey)
                .then(tables.makeTableRowHandler(self, [survey], 'survey versions'))
                .then(redirectIfDeleteSelf(survey))
                .then(utils.successHandler(self, event, "Survey version deleted."))
                .catch(utils.failureHandler());
        });
    };
    self.publish = function(vm, event) {
        alerts.confirmation("Are you sure you want to publish this survey version?\n\nOnce published, it can't be deleted.", function() {
            utils.startHandler(self, event);
            serverService.publishSurvey(vm.guid, vm.createdOn)
                .then(load)
                .then(utils.successHandler(vm, event, "Survey has been published."))
                .catch(utils.failureHandler());
        });
    };
    function getHistoryItems(response) {
        // Do not register an error here. Do not return the promise. We don't
        // care if Bluebird doesn't like it.
        serverService.getSurveyAllRevisions(params.guid).then(binder.update());
        return response;
    }
    function load(survey) {
        // This is faster than it looks because of client-side caching
        return serverService.getSurvey(params.guid, params.createdOn)
            .then(binder.update())
            .then(getHistoryItems)
            .then(binder.update())
            .catch(utils.failureHandler({
                redirectTo: "surveys",
                redirectMsg: "Survey not found."
            }));
    }
    load(params);
};