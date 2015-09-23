var ko = require('knockout');
var serverService = require('../../services/server_service.js');
var utils = require('../../utils');

// TODO: All this code is copied in any table that allows deletion...
function addCheckedObs(item) {
    item.checkedObs = ko.observable(false);
    return item;
}
function hasBeenChecked(item) {
    return item.checkedObs();
}
function makeDeletionCall(item) {
    return function() {
        return serverService.deleteSchedulePlan(item);
    };
}

module.exports = function() {
    var self = this;

    self.messageObs = ko.observableArray("");
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
    self.atLeastOneChecked = function () {
        return self.itemsObs().some(function(item) {
            return item.checkedObs();
        });
    }
    self.deleteSchedulePlans = function(vm, event) {
        var deletables = self.itemsObs().filter(hasBeenChecked);
        var msg = (deletables.length > 2) ?
                "Are you sure you want to delete these schedules?" :
                "Are you sure you want to delete this schedule?";
        var confirmMsg = (deletables.length > 2) ?
                "Schedules deleted." : "Schedule deleted.";
        if (confirm(msg)) {
            utils.startHandler(self, event);

            deletables.reduce(function(promise, deletable) {
                if (promise === null) {
                    return serverService.deleteSchedulePlan(deletable.guid);
                } else {
                    return promise.then(makeDeletionCall(deletable.guid));
                }
            }, null)
                    .then(utils.makeTableRowHandler(vm, deletables, "#/scheduleplans"))
                    .then(utils.successHandler(vm, event, confirmMsg))
                    .catch(utils.failureHandler(vm, event));
        }
    };

    serverService.getSchedulePlans().then(function(response) {
        if (response.items.length) {
            response.items.sort(utils.makeFieldSorter("label"));
            self.itemsObs(response.items.map(addCheckedObs));
        } else {
            document.querySelector(".loading_status").textContent = "There are currently no schedules.";
        }
    });
};