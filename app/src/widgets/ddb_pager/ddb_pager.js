var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../utils');

var $ = require('jquery');

var FIELDS = ['idFilter','assignmentFilter','offsetKey','pageKey','pageSize','totalRecords',
    'currentPage','totalPages','searchLoading','pagerLoading'];
    
var pageSize = 25;

function assignToValue(assignment, defaultValue) {
    if (assignment === 'all' || typeof assignment === 'undefined' || assignment === null) {
        return defaultValue;
    }
    return assignment === true || assignment === 'true';
}

/**
 * @params loadingFunc - the function to call to load resources. The function takes the parameters 
 *      pageKey, pageSize.
 * @params pageKey - a key to make the pagination on this table unique from other pagination on 
 *      the screen
 * @params top - mark one of the pagers as the top pager, and only that pager will take responsibility
 *      for calling for the first page of records. Also, search is hidden for the bottom control.
 */
module.exports = function(params) {
    var self = this;
    var loadingFunc = params.loadingFunc;
    var pageKey = params.pageKey;
    
    utils.observablesFor(self, FIELDS);
    self.assignmentFilterObs('all');
    
    self.doSearch = function(vm, event) {
        if (event.keyCode === 13) {
            self.searchLoadingObs(true);
            self.currentPageObs(0);
            wrappedLoadingFunc();
        }
    }
    if (params.top) {
        self.assignmentFilterObs.subscribe(function(newValue) {
            self.searchLoadingObs(true);
            self.offsetKeyObs(null);
            self.currentPageObs(0);
            wrappedLoadingFunc();
            return newValue;
        });
    }
    self.pageSizeObs(pageSize);
    self.currentPageObs(0);
    self.totalPagesObs(0);
    self.searchLoadingObs(false);
    self.pagerLoadingObs(false);
    self.top = params.top;
    self.assignmentFilterObs('all');
    
    self.firstPage = function(vm, event) {
        self.offsetKeyObs(null);
        self.idFilterObs("");
        self.assignmentFilterObs(null);
        self.pagerLoadingObs(true);
        self.currentPageObs(0);
        wrappedLoadingFunc();
    }
    self.nextPage = function(vm, event) {
        if (self.offsetKeyObs() !== null) {
            self.pagerLoadingObs(true);
            self.currentPageObs(self.currentPageObs()+1);
            wrappedLoadingFunc();
        }
    }
    
    // Postbox allows multiple instances of a paging control to stay in sync above
    // and below the table. The 'top' control is responsible for kicking off the 
    // first page of records.
    ko.postbox.subscribe(pageKey+'-recordsPaged', updateModel);

    function wrappedLoadingFunc() {
        var offsetKey = self.offsetKeyObs();
        var idFilter = self.idFilterObs();
        var assignmentFilter = assignToValue(self.assignmentFilterObs(), null);

        loadingFunc({
            offsetKey: offsetKey,
            pageSize: pageSize,
            idFilter: idFilter,
            assignmentFilter: assignmentFilter
        }).then(function(response) {
            ko.postbox.publish(pageKey+'-recordsPaged', response);
            updateModel(response);
            self.searchLoadingObs(false);
            self.pagerLoadingObs(false);
            return response;
        }).catch(utils.failureHandler());
    }

    function updateModel(response) {
        self.offsetKeyObs(response.offsetKey);
        self.pageSizeObs(response.pageSize);
        self.totalRecordsObs(response.total);
        self.idFilterObs(response.idFilter || "");
        self.totalPagesObs( Math.ceil(response.total/response.pageSize) );
    }
    if (params.top) {
        wrappedLoadingFunc();
    }
};