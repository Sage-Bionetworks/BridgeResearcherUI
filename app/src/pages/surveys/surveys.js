var ko = require('knockout');
var serverService = require('../../services/server_service');
var sharedModuleUtils = require('../../shared_module_utils');
var utils = require('../../utils');
var fn = require('../../functions');
var Promise = require('bluebird');
var surveyFieldsToDelete = ['guid','version','createdOn','modifiedOn','published','deleted'];
var tables = require('../../tables');
var root = require('../../root');

function addScheduleField(survey) {
    survey.schedulePlanObs = ko.observableArray([]);
}
function collectGuids(object, array) {
    Object.keys(object).forEach(function(prop) {
        if (prop === "survey") {
            array.push(object[prop].guid);
        } else if (typeof object[prop] === "object") {
            collectGuids(object[prop], array);
        }
    });
    return array;
}
function annotateSurveys(surveys, plans) {
    plans.forEach(function(plan) {
        var allPlanGuids = collectGuids(plan, []);    
        surveys.forEach(function(survey) {
            if (allPlanGuids.indexOf(survey.guid) > -1) {
                survey.schedulePlanObs.push({label: plan.label, guid: plan.guid});
            } 
        });
    });
}
function deleteItem(survey) {
    return serverService.deleteSurvey(survey, false);
}

module.exports = function() {
    var self = this;

    fn.copyProps(self, fn, 'formatDateTime');
    fn.copyProps(self, root, 'isDeveloper');
    fn.copyProps(self, sharedModuleUtils, 'formatModuleLink', 'moduleHTML');
    
    tables.prepareTable(self, {
        name: 'survey',
        type: 'Survey',
        delete: deleteItem,
        refresh: load
    });

    self.formatSchedules = function(survey) {
        return survey.schedulePlanObs().map(function(obj) {
            return obj.label;
        }).join(', ');
    };
    self.copySurveys = function(vm, event) {
        var copyables = self.itemsObs().filter(tables.hasBeenChecked);
        var confirmMsg = (copyables.length > 1) ?
            "Surveys have been copied." : "Survey has been copied.";

        utils.startHandler(vm, event);
        Promise.mapSeries(copyables, function(survey) {
            return serverService.getSurvey(survey.guid, survey.createdOn).then(function(fullSurvey) {
                fullSurvey.name += " (Copy)";
                surveyFieldsToDelete.forEach(function(field) {
                    delete fullSurvey[field]; 
                });
                fullSurvey.elements.forEach(function(element) {
                    delete element.guid;
                });
                return serverService.createSurvey(fullSurvey);
            });
        }).then(load)
            .then(utils.successHandler(vm, event, confirmMsg))
            .catch(utils.listFailureHandler());
    };
    self.openModuleBrowser = function() {
        root.openDialog('module_browser', {
            type: 'survey', 
            closeModuleBrowser: self.closeModuleBrowser
        });
    };
    self.closeModuleBrowser = function() {
        root.closeDialog();
        load();
    };
    function getSchedulePlans(response) {
        if (response.items.length) {
            var surveys = response.items;
            return serverService.getSchedulePlans().then(function(res) {
                annotateSurveys(surveys, res.items);
            });
        }
    }
    function load() {
        return sharedModuleUtils.loadNameMaps()
            .then(serverService.getSurveys)
            .then(fn.handleSortItems('name'))
            .then(fn.handleForEach('items', addScheduleField))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .then(getSchedulePlans)
            .catch(utils.failureHandler());
    }
    load();
};