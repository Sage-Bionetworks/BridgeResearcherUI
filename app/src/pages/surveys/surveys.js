'use strict';
var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

function addScheduleField(survey) {
    survey.schedulePlanObs = ko.observableArray([]);
}
function extractSurveyGuidsFromSchedule(schedule) {
    return schedule.activities.filter(function(activity) {
        return !!activity.survey;
    }).map(function(activity) {
        return activity.survey.guid;
    });
}
function extractSurveyGuids(plan) {
    var strategy = plan.strategy;
    switch(strategy.type) {
        case 'SimpleScheduleStrategy':
            return extractSurveyGuidsFromSchedule(strategy.schedule);
        case 'ABTestScheduleStrategy':
            return (strategy.scheduleGroups || []).forEach(function (group) {
                return extractSurveyGuidsFromSchedule(group.schedule);
            }).reduce(function(initial, array) {
                return initial.concat(array);
            }, []);
    }
}
function annotateSurveys(surveys, plans) {
    var surveysMap = surveys.reduce(function(map, survey) {
        map[survey.guid] = survey;
        return map;
    }, {});
    (plans || []).forEach(function(plan) {
        extractSurveyGuids(plan).forEach(function(guid) {
            surveysMap[guid].schedulePlanObs.push({label: plan.label, guid: plan.guid});
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

    serverService.getSurveys().then(function(response) {
        if (response.items.length) {
            response.items.sort(utils.makeFieldSorter("name"));
            response.items.forEach(addScheduleField);
            self.itemsObs(response.items);
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
    }).catch(function(response) {
        console.error(response);
    });
};