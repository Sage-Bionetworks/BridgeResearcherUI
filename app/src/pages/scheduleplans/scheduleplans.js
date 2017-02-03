var serverService = require('../../services/server_service.js');
var scheduleUtils = require('../schedule/schedule_utils.js');
var utils = require('../../utils');
var fn = require('../../transforms');
var tables = require('../../tables');
var root = require('../../root');

var SORTER = utils.makeFieldSorter("label");

function deleteItem(plan) {
    return serverService.deleteSchedulePlan(plan.guid);
}

module.exports = function() {
    var self = this;
    self.allItems = [];

    self.isAdmin = root.isAdmin;
    self.isDeveloper = root.isDeveloper;
    
    tables.prepareTable(self, {
        name: "schedule",
        type: "SchedulePlan", 
        delete: deleteItem, 
        refresh: load
    });

    self.formatDateTime = fn.formatLocalDateTime;
    self.formatScheduleType = scheduleUtils.formatScheduleStrategyType;
    self.formatStrategy = scheduleUtils.formatStrategy;

    function load() {
        scheduleUtils.loadOptions().then(function() {
            return serverService.getSchedulePlans();    
        }).then(function(response) {
            response.items.sort(SORTER);
            self.itemsObs(response.items);
        });
    }
    load();
};