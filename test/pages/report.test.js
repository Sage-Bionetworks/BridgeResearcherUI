var expect = require('chai').expect;
var rewire =  require('rewire');
var sinon = require('sinon');
var stubs = require('../stubs');
var serverService = stubs.serverService;

var PARAMS = {id: "test-report"};

var ITEMS = { 
    "items": [
        {"date":"2016-02-07","type":"ReportData","data":{"a":"b"}},
        {"date":"2016-02-08","type":"ReportData","data":{"a":"c"}},
        {"date":"2016-02-09","type":"ReportData","data":{"a":"d"}}
    ], 
    "startDate": "2016-02-07", 
    "endDate": "2016-02-10", 
    "total": 3, 
    "type": "DateRangeResourceList" 
}

// TODO: convenience method for mockig return based on specific parameters, so 
// we can verify that this is working
var ReportViewModel = rewire('../../app/src/pages/report/report');
ReportViewModel.__set__({
    "serverService": serverService
        .doReturn('deleteStudyReportRecord', {message: "Report deleted."})
        .doReturn('getStudyReport', ITEMS),
    "tables": stubs.tables
});

describe("ReportViewModel", function() {
    it("works", function() {
        var view = new ReportViewModel(PARAMS);

        console.log(serverService.getStudyReport.firstCall.args);
    });
});
/*
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
        self.itemsObs(response.items.sort());
    }
    function load() {
        serverService.getStudyReport(params.id, startDate(), endDate()).then(mapResponse);
    }
    load();
};
*/