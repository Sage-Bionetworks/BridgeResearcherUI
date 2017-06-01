var serverService = require('../../services/server_service');
var utils = require('../../utils');
var Promise = require('bluebird');
var tables = require('../../tables');
var scheduleUtils = require('../schedule/schedule_utils');
var fn = require('../../functions');

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

    fn.copyProps(self, scheduleUtils, 'formatCompoundActivity');

    self.copy = function(vm, event) {
        var copyables = self.itemsObs().filter(tables.hasBeenChecked);
        var confirmMsg = (copyables.length > 1) ?
            "Tasks have been copied." : "Task has been copied.";

        utils.startHandler(vm, event);
        Promise.mapSeries(copyables, function(task) {
            task.taskId += "-copy";
            delete task.version;
            console.log(JSON.stringify(task));
            return serverService.createTaskDefinition(task);
        }).then(load)
            .then(utils.successHandler(vm, event, confirmMsg))
            .catch(utils.failureHandler({transient:false}));
    };
    function load() {
        scheduleUtils.loadOptions()
            .then(serverService.getTaskDefinitions)
            .then(fn.handleSort('items','taskId'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};