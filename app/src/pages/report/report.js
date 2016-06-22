var ko = require('knockout');
var serverService = require('../../services/server_service');
var root = require('../../root');
var jsonFormatter = require('../../json_formatter');
var tables = require('../../tables');

function startDate() {
    var d = new Date();
    d.setDate(d.getDate() - 21);
    return d.toISOString().split("T")[0];
}
function endDate() {
    return new Date().toISOString().split("T")[0];
}

module.exports = function(params) {
    var self = this;

    self.identifierObs = ko.observable(params.id);
    self.isDeveloper = root.isDeveloper;

    function deleteItem(item) {
        return serverService.deleteStudyReportRecord(params.id, item.date);        
    }

    tables.prepareTable(self, "report record", "#/reports", deleteItem);

    self.addReport = function(vm, event) {
        root.openDialog('add_report', {
            closeDialog: self.closeDialog, 
            identifier: params.id,
            type: "study"
        });
    };
    self.closeDialog = function() {
        root.closeDialog();
        load();
    };
    self.toggle = function(model) {
        model.collapsedObs(!model.collapsedObs());
    };
    self.editReportRecord = function(item) {
        root.openDialog('edit_report', {
            closeDialog: self.closeDialog,
            identifier: params.id,
            date: item.date,
            data: item.data
        });
        return false;
    };
    function mapResponse(response) {
        response.items = response.items.map(jsonFormatter.mapItem);
        console.log(response);
        self.itemsObs(response.items.sort());
    }
    function load() {
        serverService.getStudyReport(params.id, startDate(), endDate()).then(mapResponse);
    }
    load();
};
