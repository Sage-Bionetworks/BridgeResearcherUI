var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../utils');
var bind = require('../../binder');

var PAGE_SIZE = 25;

/**
 * @params loadingFunc - the function to call to load resources. The function takes the parameters 
 *      pageKey
 * @params pageKey - a key to make the pagination on this table unique from other pagination on 
 *      the screen
 * @params top - mark one of the pagers as the top pager, and only that pager will take responsibility
 *      for calling for the first page of records. Also, search is hidden for the bottom control.
 * @params showAssignment - show assignment controls (true of false, defaults to true)
 */
module.exports = function(params) {
    var self = this;
    var loadingFunc = params.loadingFunc;
    var pageKey = params.pageKey;
    var currentAssignmentFilter = null;
    var currentOffsetKey = null;
    if (params.top) { // verify we're never accessing this in trailing pager
        var history = [null];
    }
    var pendingRequest = false;

    self.top = params.top;
    self.showAssignment = (typeof params.showAssignment === "boolean") ? 
        params.showAssignment : true;

    bind(self)
        .obs('idFilter')
        .obs('pageKey')
        .obs('totalRecords')
        .obs('currentPage')
        .obs('totalPages')
        .obs('hasPrevious', false)
        .obs('hasNext', false)
        .obs('hasFirstPage', false)
        .obs('searchLoading')
        .obs('pagerLoading');
    
    function clear() {
        self.currentPageObs(0);
        history = [null];
    }
    function getValue(value) {
        switch(value) {
            case 'true': return 'true';
            case 'false': return 'false';
            default: return null;
        }
    }
    function addCurrentPage(response) {
        response.hasHistory = history.length > 1;
        response.currentPage = self.currentPageObs();
        history[response.currentPage+1] = response.offsetKey;
        currentAssignmentFilter = response.assignmentFilter || null;
        ko.postbox.publish(pageKey+'-recordsPaged', response);
        console.log("addCurrentPage", response.hasHistory, history);
        return response;
    }
    function wrappedLoadingFunc(offsetKey) {
        pendingRequest = true;
        var params = {pageSize: PAGE_SIZE, offsetKey: offsetKey,
            idFilter: self.idFilterObs(), assignmentFilter: currentAssignmentFilter};
        return loadingFunc(params)
            .then(addCurrentPage)
            .catch(utils.failureHandler());
    }
    function updateModel(response) {
        self.hasNextObs(!!response.offsetKey);
        self.hasPreviousObs(response.hasHistory);
        self.hasFirstPageObs(response.currentPage > 0);
        self.totalRecordsObs(response.total);
        self.idFilterObs(response.idFilter || "");
        self.currentPageObs(response.currentPage); // this was added in addCurrentPage()
        self.totalPagesObs( Math.ceil(response.total/PAGE_SIZE) );
        self.pagerLoadingObs(false);
        self.searchLoadingObs(false);
        pendingRequest = false;
        return response;
    }

    self.doSearch = function(vm, event) {
        if (event.keyCode === 13) {
            clear();
            self.searchLoadingObs(true);
            wrappedLoadingFunc();
        }
    };
    if (self.top) {
        self.firstPage = function(vm, event) {
            if (!pendingRequest) {
                clear();
                currentAssignmentFilter = null;
                self.idFilterObs("");
                self.pagerLoadingObs(true);
                wrappedLoadingFunc();
            }
        };
        self.previousPage = function(vm, event) {
            if (!pendingRequest) {
                history.pop(); // next page key
                history.pop(); // current page key
                var lastKey = history[history.length-1]; // the last page key
                self.currentPageObs(self.currentPageObs()-1);
                self.pagerLoadingObs(true);
                wrappedLoadingFunc(lastKey);
            }
        };
        self.nextPage = function(vm, event) {
            if (!pendingRequest) {
                var lastKey = history[history.length-1];        
                self.pagerLoadingObs(true);
                self.currentPageObs(self.currentPageObs()+1);
                wrappedLoadingFunc(lastKey);
            }
        };
        ko.postbox.subscribe(pageKey+'-firstPage', self.firstPage);
        ko.postbox.subscribe(pageKey+'-previousPage', self.previousPage);
        ko.postbox.subscribe(pageKey+'-nextPage', self.nextPage);
    } else {
        self.firstPage = function(vm, event) {
            ko.postbox.publish(pageKey+'-firstPage');
        };
        self.previousPage = function(vm, event) {
            ko.postbox.publish(pageKey+'-previousPage');
        };
        self.nextPage = function(vm, event) {
            ko.postbox.publish(pageKey+'-nextPage');
        };
    }
    self.assignFilter = function(vm, event) {
        clear();
        currentAssignmentFilter = getValue(event.target.value);
        wrappedLoadingFunc();
        return true;
    };
    ko.postbox.subscribe(pageKey+'-recordsPaged', updateModel);
    // parent page is resetting, go back to first page, clear filters, etc.
    ko.postbox.subscribe(pageKey+'-refresh', self.firstPage);

    if (self.top) {
        self.firstPage();
    }
    // why. why? why?!?!?!?!?!?!?!?
    document.querySelector("#assignEither").checked = true;
};