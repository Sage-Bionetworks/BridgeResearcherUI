var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var fn = require('../../transforms');
var Promise = require('bluebird');
var tables = require('../../tables');
var root = require('../../root');

function deleteItem(task) {
    return serverService.deleteTaskDefinition(task.taskId);
}

module.exports = function() {
    var self = this;

    tables.prepareTable(self, {
        name: 'task',
        type: 'CompoundActivityDefinition',
        delete: deleteItem,
        refresh: load
    });

    self.formatDescription = function(task) {
        var phrase = [];
        var schemas = task.schemaList.map(function(schema) {
            return schema.id + ((schema.revision) ? 
                ' <i>(rev. ' + schema.revision + ')</i>' : '');
        }).join(', ');
        if (schemas) {
            phrase.push(schemas);
        }
        var surveys = task.surveyList.map(function(survey) {
            return surveyNameMap[survey.guid] + ((survey.createdOn) ? 
                ' <i>(pub. ' + fn.formatLocalDateTime(survey.createdOn) + ')</i>' : '');
        }).join(', ');
        if (surveys) {
            phrase.push(surveys);
        }
        return phrase.join('; ');
    };
    self.copy = function(vm, event) {
        var copyables = self.itemsObs().filter(tables.hasBeenChecked);
        var confirmMsg = (copyables.length > 1) ?
            "Compound tasks have been copied." : "Compound task has been copied.";

        utils.startHandler(vm, event);
        Promise.mapSeries(copyables, function(task) {
            delete task.version;
            return serverService.createTaskDefinition(task);
        }).then(load)
            .then(utils.successHandler(vm, event, confirmMsg))
            .catch(utils.listFailureHandler());
    };

    var surveyNameMap = {};

    function load() {
        return serverService.getPublishedSurveys().then(function(response) {
            response.items.forEach(function(survey) {
                surveyNameMap[survey.guid] = survey.name;
            });
            return response;
        }).then(function() {
            return serverService.getTaskDefinitions().then(function(response) {
                response.items.sort(utils.makeFieldSorter("taskId"));
                self.itemsObs(response.items);
                return response.items;
            });
        }).catch(utils.failureHandler());
    }
    load();
};