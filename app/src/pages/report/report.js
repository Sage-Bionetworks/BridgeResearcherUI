var ko = require('knockout');
var serverService = require('../../services/server_service');
var root = require('../../root');
var jsonFormatter = require('../../json_formatter');
var tables = require('../../tables');

var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function firstDayOfMonth(year, month) {
    return new Date(year, month, 1).toISOString().split("T")[0];
}
function lastDayOfMonth(year, month) {
    return new Date(year, month+1, 0).toISOString().split("T")[0];
}

module.exports = function(params) {
    var self = this;

    self.identifierObs = ko.observable(params.id);
    self.isDeveloper = root.isDeveloper;
    self.showLoaderObs = ko.observable(false);

    var d = new Date();
    self.currentMonth = d.getMonth();
    self.currentYear = d.getFullYear();

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
    self.formatMonthObs = ko.observable();

    self.priorMonth = function() {
        if (self.currentMonth === 0) {
            self.currentYear--;
            self.currentMonth = 11;
        } else {
            self.currentMonth--;
        }
        load();
    };
    self.nextMonth = function() {
        if (self.currentMonth === 11) {
            self.currentYear++;
            self.currentMonth = 0;
        } else {
            self.currentMonth++;
        }
        load();
    };
    self.thisMonth = function() {
        var d = new Date();
        self.currentMonth = d.getMonth();
        self.currentYear = d.getFullYear();
        load();
    };

    function mapResponse(response) {
        response.items = response.items.map(jsonFormatter.mapItem);
        self.itemsObs(response.items.sort());
    }
    function load() {
        self.showLoaderObs(true);
        self.formatMonthObs(MONTHS[self.currentMonth] + " " + self.currentYear);
        var startDate = firstDayOfMonth(self.currentYear, self.currentMonth);
        var endDate = lastDayOfMonth(self.currentYear, self.currentMonth);
        serverService.getStudyReport(params.id, startDate, endDate)
            .then(mapResponse)
            .then(function() {
                self.showLoaderObs(false);
            });
    }
    load();
};
