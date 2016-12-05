var serverService = require('../../services/server_service.js');
var scheduleUtils = require('../schedule/schedule_utils.js');
var utils = require('../../utils');
var fn = require('../../transforms');
var tables = require('../../tables');
var root = require('../../root');

var SORTER = utils.makeFieldSorter("label");

module.exports = function() {
    var self = this;
    self.allItems = [];

    self.isAdmin = root.isAdmin;
    
    tables.prepareTable(self, "schedule", function(plan) {
        return serverService.deleteSchedulePlan(plan.guid);
    }, load);

    self.formatDateTime = fn.formatLocalDateTime;
    self.formatScheduleType = scheduleUtils.formatScheduleStrategyType;
    self.formatStrategy = scheduleUtils.formatStrategy;

    function load() {
        serverService.getSchedulePlans().then(function(response) {
            response.items.sort(SORTER);
            self.itemsObs(response.items);
        });
    }
    scheduleUtils.loadOptions().then(load);
};