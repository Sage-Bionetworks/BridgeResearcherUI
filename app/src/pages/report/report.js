var ko = require('knockout');
var serverService = require('../../services/server_service');
var root = require('../../root');
var jsonFormatter = require('../../json_formatter');
var tables = require('../../tables');
var utils = require('../../utils');

var SORTER = utils.makeFieldSorter("date");
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
    self.publicObs = ko.observable(false);
    self.toggleObs = ko.observable();

    function publicToggled(newValue) {
        utils.startHandler(self, event);
        serverService.updateStudyReportIndex({
            identifier: params.id, public: newValue
        }).then(function(response) {
            self.publicObs(newValue);
            self.toggleObs(newValue);
            return response;
        })
        .then(utils.successHandler(self, event, "Report updated."))
        .catch(utils.failureHandler(self, event));
    }
    function loadIndex() {
        return serverService.getStudyReportIndex(params.id).then(function(response) {
            self.publicObs(response.public);
            self.toggleObs(response.public);
            self.toggleObs.subscribe(publicToggled, null, 'change');
        });
    }
    loadIndex();

    var d = new Date();
    self.currentMonth = d.getMonth();
    self.currentYear = d.getFullYear();

    tables.prepareTable(self, { 
        name:"report record", 
        delete: deleteItem
    });

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

    function deleteItem(item) {
        return serverService.deleteStudyReportRecord(params.id, item.date);        
    }
    function mapResponse(response) {
        response.items = response.items.map(jsonFormatter.mapItem);
        self.itemsObs(response.items.sort(SORTER).reverse());
    }
    function loaderOff() {
        self.showLoaderObs(false);
    }
    function load() {
        self.showLoaderObs(true);
        self.formatMonthObs(MONTHS[self.currentMonth] + " " + self.currentYear);
        var startDate = firstDayOfMonth(self.currentYear, self.currentMonth);
        var endDate = lastDayOfMonth(self.currentYear, self.currentMonth);
        serverService.getStudyReport(params.id, startDate, endDate)
            .then(mapResponse)
            .then(loaderOff);
    }
    load();
};
