var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var criteriaUtils = require('../../criteria_utils');
var root = require('../../root');
var Promise = require('bluebird');

module.exports = function() {
    var self = this;

    self.itemsObs = ko.observableArray([]);
    self.criteriaLabel = criteriaUtils.label;
    self.isDeveloper = root.isDeveloper;

    self.atLeastOneChecked = function () {
        return self.itemsObs().some(function(item) {
            return item.checkedObs();
        });
    };

    self.deleteSubpopulations = function(vm, event) {
        var deletables = self.itemsObs().filter(utils.hasBeenChecked);
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
            self.itemsObs(response.items.sort(utils.makeFieldSorter("name")).map(utils.addCheckedObs));
        } else {
            document.querySelector(".loading_status").textContent = "There are currently no consent groups.";
        }
    });
};