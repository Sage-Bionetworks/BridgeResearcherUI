var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var fn = require('../../transforms');
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

module.exports = function() {
    var self = this;

    self.formatDateTime = fn.formatLocalDateTime;
    self.isAdmin = root.isAdmin;

    tables.prepareTable(self, 'survey', function(survey) {
        return serverService.deleteSurvey(survey, true);
    }, load);

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

    function load() {
        return serverService.getSurveys().then(function(response) {
            response.items.sort(utils.makeFieldSorter("name"));
            response.items.forEach(addScheduleField);
            self.itemsObs(response.items);
            return response.items;
        }).then(function(surveys) {
            if (surveys.length) {
                return serverService.getSchedulePlans().then(function(response) {
                    annotateSurveys(surveys, response.items);
                });
            }
        }).catch(utils.failureHandler());
    }
    load();
};