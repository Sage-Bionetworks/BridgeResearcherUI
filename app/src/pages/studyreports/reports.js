var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');
var tables = require('../../tables');
var ko = require('knockout');
var fn = require('../../functions');

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
    function processStudyReport(item) {
        item.publicObs = ko.observable(item.public);
        item.toggleObs = ko.observable(item.public);
        item.toggleObs.subscribe(function(newValue) {
            item.public = newValue;
            serverService.updateStudyReportIndex(item).then(function() {
                item.toggleObs(newValue);
                item.publicObs(newValue);
            });
        });
    }
    function load() {
        serverService.getStudyReports()
            .then(fn.handleForEach('items', processStudyReport))
            .then(fn.handleSort('items', 'identifier'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};