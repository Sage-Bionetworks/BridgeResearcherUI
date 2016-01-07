'use strict';
var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

function addCheckedObs(item) {
    item.checkedObs = ko.observable(false);
    return item;
}
function hasBeenChecked(item) {
    return item.checkedObs();
}
function getAppVersions(minValue, maxValue) {
    if (utils.isDefined(minValue) && utils.isDefined(maxValue)) {
        return "Versions " + minValue + "-" + maxValue;
    } else if (utils.isDefined(minValue)) {
        return "Versions " + minValue + "+";
    } else if (utils.isDefined(maxValue)) {
        return "Versions " + "0-" + maxValue;
    }
    return "<i>All versions</i>";
}

module.exports = function() {
    var self = this;

    self.itemsObs = ko.observableArray([]);

    self.criteriaLabel = function(subpop) {
        var arr = [];
        arr.push(getAppVersions(subpop.minAppVersion, subpop.maxAppVersion));
        if (subpop.allOfGroups && subpop.allOfGroups.length) {
            arr.push("user must be in data group(s) " + subpop.allOfGroups.map(function(a) { return '"'+a+'"'; }).join(", "));
        }
        if (subpop.noneOfGroups && subpop.noneOfGroups.length) {
            arr.push("user cannot be in data group(s) " + subpop.noneOfGroups.map(function(a) { return '"'+a+'"'; }).join(", "));
        }
        return arr.join("; ");
    };

    self.atLeastOneChecked = function () {
        return self.itemsObs().some(function(item) {
            return item.checkedObs();
        });
    };

    self.deleteSubpopulations = function(vm, event) {
        var deletables = self.itemsObs().filter(hasBeenChecked);
        var msg = (deletables.length > 1) ?
                "Are you sure you want to delete these consent groups?" :
                "Are you sure you want to delete this consent group?";
        var confirmMsg = (deletables.length > 1) ?
                "Consent groups deleted." : "Consent group deleted.";

        if (confirm(msg)) {
            utils.startHandler(self, event);
            var promises = deletables.map(function(plan) {
                return serverService.deleteSubpopulation(plan.guid);
            });
            Promise.all(promises)
                .then(utils.makeTableRowHandler(vm, deletables, "#/subpopulations"))
                .then(utils.successHandler(vm, event, confirmMsg))
                .catch(utils.failureHandler(vm, event));
        }
    };

    serverService.getAllSubpopulations().then(function(response) {
        if (response.items.length) {
            self.itemsObs(response.items.sort(utils.makeFieldSorter("name")).map(addCheckedObs));
        } else {
            document.querySelector(".loading_status").textContent = "There are currently no consent groups.";
        }
    });
};