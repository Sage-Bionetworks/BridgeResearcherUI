var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../utils');

var PAGE_SIZE = 5;
var FIELDS = ['offsetBy','pageSize','totalRecords','totalPages','currentPage'];

module.exports = function(params) {
    var self = this;
    var loadingFunc = params.loadingFunc;

    utils.observablesFor(self, FIELDS);
    self.offsetByObs(0);
    self.pageSizeObs(PAGE_SIZE);
    self.currentPageObs(0);

    self.previousPage = function() {
        var page = self.currentPageObs() -1;
        if (page >= 0) {
            wrappedLoadingFunc(page*PAGE_SIZE, PAGE_SIZE);
        }
    }
    self.nextPage = function() {
        var page = self.currentPageObs() +1;
        if (page <= self.totalPagesObs()-1) {
            wrappedLoadingFunc(page*PAGE_SIZE, PAGE_SIZE);
        }
    }
    self.firstPage = function() {
        wrappedLoadingFunc(0, PAGE_SIZE);
    }
    self.lastPage = function() {
        wrappedLoadingFunc( (self.totalPagesObs()-1) * PAGE_SIZE, PAGE_SIZE );
    };
    
    ko.postbox.subscribe('recordsPaged', updateModel);
    
    function wrappedLoadingFunc(offsetBy, pageSize) {
        // knockout doing its dependency management thing, calls this with invalid page.
        if (offsetBy >= 0) {
            loadingFunc(offsetBy, pageSize).then(function(response) {
                ko.postbox.publish('recordsPaged', response);
                updateModel(response);
            });
        }
    }
    function updateModel(response) {
        self.offsetByObs(response.offsetBy);
        self.pageSizeObs(response.pageSize);
        self.totalRecordsObs(response.total);
        self.currentPageObs(response.offsetBy/response.pageSize);
        self.totalPagesObs( Math.ceil(response.total/response.pageSize) );
    }
};