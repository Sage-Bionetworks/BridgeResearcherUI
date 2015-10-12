var ko = require('knockout');
var serverService = require('../../services/server_service.js');
var scheduleService = require('../../services/schedule_service.js');
var utils = require('../../utils');
var Promise = require('es6-promise').Promise;

function addCheckedObs(item) {
    item.checkedObs = ko.observable(false);
    return item;
}
function hasBeenChecked(item) {
    return item.checkedObs();
}

module.exports = function() {
    var self = this;

    self.itemsObs = ko.observableArray([]);
    self.formatDateTime = utils.formatDateTime;
    // TODO: This information is also on the detail editor screen.
    self.formatScheduleType = function(type) {
        if (type === "SimpleScheduleStrategy") {
            return "Simple Schedule Plan";
        } else if (type === "ABTestScheduleStrategy") {
            return "A/B Test Schedule Plan";
        }
    };
    self.formatVersions = function(minValue, maxValue) {
        if (utils.isDefined(minValue) && utils.isDefined(maxValue)) {
            return minValue + "-" + maxValue;
        } else if (utils.isDefined(minValue)) {
            return minValue + "+";
        } else if (utils.isDefined(maxValue)) {
            return "0-" + maxValue;
        }
        return "<i>All versions</i>";
    };
    self.atLeastOneChecked = function () {
        return self.itemsObs().some(function(item) {
            return item.checkedObs();
        });
    }
    self.copySchedulePlans = function(vm, event) {
        var copyables = self.itemsObs().filter(hasBeenChecked);
        var confirmMsg = (copyables.length > 1) ?
            "Schedules have been copied." : "Schedule has been copied.";

        utils.startHandler(vm, event);
        var promises = copyables.map(function(plan) {
            var newSchedule = JSON.parse(JSON.stringify(plan));
            delete plan.guid;
            delete plan.version;
            plan.label += " (Copy)";
            plan.minAppVersion = 9999999;
            delete plan.maxAppVersion;
            return serverService.saveSchedulePlan(plan);
        });
        Promise.all(promises)
            .then(load)
            .then(utils.successHandler(vm, event, confirmMsg))
            .catch(utils.failureHandler(vm, event));

    };
    self.deleteSchedulePlans = function(vm, event) {
        var deletables = self.itemsObs().filter(hasBeenChecked);
        var msg = (deletables.length > 1) ?
                "Are you sure you want to delete these schedules?" :
                "Are you sure you want to delete this schedule?";
        var confirmMsg = (deletables.length > 1) ?
                "Schedules deleted." : "Schedule deleted.";

        if (confirm(msg)) {
            utils.startHandler(self, event);
            var promises = deletables.map(function(plan) {
                return serverService.deleteSchedulePlan(plan.guid);
            });
            Promise.all(promises)
                .then(utils.makeTableRowHandler(vm, deletables, "#/scheduleplans"))
                .then(utils.successHandler(vm, event, confirmMsg))
                .catch(utils.failureHandler(vm, event));
        }
    };
    self.formatStrategy = scheduleService.formatStrategy;

    function load() {
        serverService.getSchedulePlans().then(function(response) {
            if (response.items.length) {
                response.items.sort(utils.makeFieldSorter("label"));
                self.itemsObs(response.items.map(addCheckedObs));
            } else {
                document.querySelector(".loading_status").textContent = "There are currently no schedules.";
            }
        });
    }
    load();
};