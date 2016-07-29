var ko = require('knockout');
var serverService = require('../../services/server_service.js');
var scheduleUtils = require('../schedule/schedule_utils.js');
var utils = require('../../utils');
var fn = require('../../transforms');
var Promise = require('bluebird');
var storeService = require('../../services/store_service');
var tables = require('../../tables');

var MULTI_FIELD_SORTER = utils.multiFieldSorter(
    utils.makeRangeSorter("minAppVersion", "maxAppVersion"),
    utils.makeFieldSorter("label")
);

function num(value, defaultValue) {
    return (typeof value !== "number") ? defaultValue : value;    
}

module.exports = function() {
    var self = this;
    self.allItems = [];

    tables.prepareTable(self, "schedule", "#/scheduleplans", function(plan) {
        return serverService.deleteSchedulePlan(plan.guid);
    });

    self.formatDateTime = fn.formatLocalDateTime;
    self.formatScheduleType = scheduleUtils.formatScheduleStrategyType;
    self.formatVersions = fn.formatVersionRange;
    self.formatStrategy = scheduleUtils.formatStrategy;
    self.filterObs = ko.observable(storeService.get('schedulePlansFilter'));
    self.applyFilter = function(vm, event) {
        if (event.keyCode === 13) {
          filterItems();
          storeService.set('schedulePlansFilter', self.filterObs());
        }
        return true;
    };
    
    self.copySchedulePlans = function(vm, event) {
        var copyables = self.itemsObs().filter(tables.hasBeenChecked);
        var confirmMsg = (copyables.length > 1) ?
            "Schedules have been copied." : "Schedule has been copied.";

        utils.startHandler(vm, event);
        return Promise.map(copyables, function(plan) {
            delete plan.guid;
            delete plan.version;
            plan.label += " (Copy)";
            plan.minAppVersion = 9999999;
            delete plan.maxAppVersion;
            return serverService.saveSchedulePlan(plan);
        }).then(load)
            .then(utils.successHandler(vm, event, confirmMsg))
            .catch(utils.failureHandler(vm, event));
    };
    
    function filterItems() {
        var filterNum = parseInt(self.filterObs(),10);
        self.itemsObs(self.allItems.filter(function(item) {
            if (isNaN(filterNum)) {
                return true;
            }
            var min = num(item.minAppVersion, 0);
            var max = num(item.maxAppVersion, Number.MAX_VALUE);
            return (filterNum >= min && filterNum <= max);
        }));
    }

    function load() {
        serverService.getSchedulePlans().then(function(response) {
            self.allItems = response.items;
            self.allItems.sort(MULTI_FIELD_SORTER);
            filterItems();
        });
    }
    scheduleUtils.loadOptions().then(load);
};