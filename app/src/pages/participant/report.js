var serverService = require('../../services/server_service');
var bind = require('../../binder');
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

    tables.prepareTable(self, "report", deleteItem);

    bind(self)
        .obs('isNew', false)
        .obs('userId', params.userId)
        .obs('name', '')
        .obs('title', '&#160;')
        .obs('identifier', params.identifier)
        .obs('formatMonth')
        .obs('showLoader', false);

    serverService.getParticipantName(params.userId).then(function(name) {
        self.titleObs(name);
        self.nameObs(name);
    });

    self.isDeveloper = root.isDeveloper;

    var d = new Date();
    self.currentMonth = d.getMonth();
    self.currentYear = d.getFullYear();    

    self.addReport = function(vm, event) {
        root.openDialog('add_report', {
            closeDialog: self.closeDialog,
            identifier: params.identifier,
            userId: params.userId,
            type: "participant"
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
            identifier: params.identifier,
            userId: params.userId,
            date: item.date,
            data: item.data,
            type: "participant"
        });
        return false;
    };    

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

    function deleteItem(item) {
        return serverService.deleteParticipantReportRecord(params.userId, params.identifier, item.date);
    }
    function mapResponse(response) {
        response.items = response.items.map(jsonFormatter.mapItem);
        self.itemsObs(response.items.sort());
    }
    function loaderOff() {
        self.showLoaderObs(false);
    }
    function load() {
        self.showLoaderObs(true);
        self.formatMonthObs(MONTHS[self.currentMonth] + " " + self.currentYear);
        var startDate = firstDayOfMonth(self.currentYear, self.currentMonth);
        var endDate = lastDayOfMonth(self.currentYear, self.currentMonth);
        serverService.getParticipantReport(params.userId, params.identifier, startDate, endDate)
            .then(mapResponse)
            .then(loaderOff);
    }
    load();
};