var serverService = require('../../services/server_service');
var utils = require('../../utils');
var Promise = require('bluebird');
var tables = require('../../tables');
var scheduleUtils = require('../schedule/schedule_utils');

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

    self.formatDescription = scheduleUtils.formatCompoundActivity;

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

    function load() {
        scheduleUtils.loadOptions().then(function() {
            return serverService.getTaskDefinitions().then(function(response) {
                response.items.sort(utils.makeFieldSorter("taskId"));
                self.itemsObs(response.items);
                return response.items;
            });
        }).catch(utils.failureHandler());
    }
    load();
};