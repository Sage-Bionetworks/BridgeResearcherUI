'use strict';
var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

var surveyFieldsToDelete = ['guid','version','createdOn','modifiedOn','published','deleted'];

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
                var lbl = plan.label + " (" + utils.formatVersionRange(plan.minAppVersion, plan.maxAppVersion)+")";
                survey.schedulePlanObs.push({label: lbl, guid: plan.guid});
            } 
        });
    });
}

module.exports = function() {
    var self = this;

    self.itemsObs = ko.observableArray([]);
    self.formatDateTime = utils.formatDateTime;

    self.formatSchedules = function(survey) {
        return survey.schedulePlanObs().map(function(obj) {
            return obj.label;
        }).join(', ');
    }
    self.atLeastOneChecked = function () {
        return self.itemsObs().some(function(item) {
            return item.checkedObs();
        });
    }    
    self.copySurveys = function(vm, event) {
        var copyables = self.itemsObs().filter(utils.hasBeenChecked);
        var confirmMsg = (copyables.length > 1) ?
            "Surveys have been copied." : "Survey has been copied.";

        utils.startHandler(vm, event);
        var promises = copyables.map(function(survey) {
            // Get individual survey because summary survey does not have the elements
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
        });
        Promise.all(promises)
            .then(load)
            .then(utils.successHandler(vm, event, confirmMsg))
            .catch(utils.failureHandler(vm, event));
    };

    function load() {
        serverService.getSurveys().then(function(response) {
            if (response.items.length) {
                response.items.sort(utils.makeFieldSorter("name"));
                response.items.forEach(addScheduleField);
                self.itemsObs(response.items.map(utils.addCheckedObs));
                return response.items;
            } else {
                document.querySelector(".loading_status").textContent = "There are currently no surveys.";
                return [];
            }
        }).then(function(surveys) {
            if (surveys.length) {
                serverService.getSchedulePlans().then(function(response) {
                    annotateSurveys(surveys, response.items);
                });
            }
        }).catch(utils.failureHandler());
    }
    load();
};