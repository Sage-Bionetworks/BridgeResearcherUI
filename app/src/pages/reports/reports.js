var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');
var Promise = require('bluebird');

module.exports = function() {
    var self = this;

    self.itemsObs = ko.observableArray([]);

    self.isDeveloper = root.isDeveloper;

    self.atLeastOneChecked = function () {
        return self.itemsObs().some(utils.hasBeenChecked);
    };
    self.deleteReports = function(vm, event) {
        var deletables = self.itemsObs().filter(utils.hasBeenChecked);
        var msg = (deletables.length > 1) ?
                "Are you sure you want to delete these reports?" :
                "Are you sure you want to delete this report?";
        var confirmMsg = (deletables.length > 1) ?
                "Reports deleted." : "Report deleted.";

        if (confirm(msg)) {
            utils.startHandler(self, event);
            Promise.map(deletables, function(item) {
                return serverService.deleteStudyReport(item.identifier);    
            }).then(utils.makeTableRowHandler(vm, deletables, "#/reports"))
                .then(utils.successHandler(vm, event, confirmMsg))
                .catch(utils.failureHandler(vm, event));
        }
    };
    self.addReport = function(vm, event) {
        root.openDialog('add_report', {closeDialog: self.closeDialog});
    };
    self.closeDialog = function() {
        root.closeDialog();
        load();
    };

    function load() {
        serverService.getStudyReports().then(function(response) {
            if (response.items.length) {
                self.itemsObs(response.items.sort(utils.makeFieldSorter("identifier")).map(utils.addCheckedObs));
            } else {
                document.querySelector(".loading_status").textContent = "There are currently no reports.";
            }
        });
    }
    load();
};