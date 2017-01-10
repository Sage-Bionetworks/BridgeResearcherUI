var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');
var tables = require('../../tables');
var ko = require('knockout');

function deleteItem(item) {
    return serverService.deleteStudyReport(item.identifier);
}

module.exports = function() {
    var self = this;

    self.isDeveloper = root.isDeveloper;

    tables.prepareTable(self, {
        name: "report", 
        delete: deleteItem
    });
    self.addReport = function(vm, event) {
        root.openDialog('add_report', {
            closeDialog: self.closeDialog, 
            type: "study"
        });
    };
    self.closeDialog = function() {
        root.closeDialog();
        load();
    };

    function load() {
        serverService.getStudyReports().then(function(response) {
            response.items.forEach(function(item) {
                item.publicObs = ko.observable(item.public);
                item.toggleObs = ko.observable(item.public);
                item.toggleObs.subscribe(function(newValue) {
                    item.public = newValue;
                    serverService.updateStudyReportIndex(item).then(function() {
                        item.toggleObs(newValue);
                        item.publicObs(newValue);
                    });
                });
            });
            self.itemsObs(response.items.sort(utils.makeFieldSorter("identifier")));
        }).catch(utils.failureHandler());
    }
    load();
};