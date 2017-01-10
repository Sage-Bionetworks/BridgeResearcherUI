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
        .doReturn('getStudyReportIndex', {identifier:'test-report',public:false})
        .doReturn('getStudyReport', ITEMS),
    "tables": stubs.tables
});

describe("ReportViewModel", function() {
    it("works", function() {
        var view = new ReportViewModel(PARAMS);

        console.log(serverService.getStudyReport.firstCall.args);
    });
});
