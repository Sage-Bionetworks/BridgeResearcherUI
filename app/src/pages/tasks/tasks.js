var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var fn = require('../../transforms');
var Promise = require('bluebird');
var tables = require('../../tables');
var root = require('../../root');

function deleteItem(task) {
    return serverService.deleteTask(task.taskId);
}

module.exports = function() {
    var self = this;

    tables.prepareTable(self, {
        name: 'task',
        type: 'task',
        delete: deleteItem,
        refresh: load
    });

    function load() {
        return serverService.getTaskDefinitions().then(function(response) {
            response.items.sort(utils.makeFieldSorter("taskId"));
            self.itemsObs(response.items);
            return response.items;
        }).catch(utils.failureHandler());
    }
    load();
};