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
 * @params showAssignment - show assignment controls (true of false, defaults to true)
 */
module.exports = function(params) {
    var self = this;
    var loadingFunc = params.loadingFunc;
    var pageKey = params.pageKey;
    var currentAssignmentFilter = null;
    var history = [null];
    var pendingRequest = false;

    self.showAssignment = (typeof params.showAssignment === "boolean") ? 
        params.showAssignment : true;
    self.showSearch = (typeof params.showSearch === "boolean") ?
        params.showSearch : false;

    bind(self)
        .obs('idFilter')
        .obs('pageKey')
        .obs('currentPage')
        .obs('hasPrevious', false)
        .obs('hasNext', false)
        .obs('hasFirstPage', false)
        .obs('searchLoading')
        .obs('showLoader');
    
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
        if (response) {
            response.hasHistory = history.length > 1;
            response.currentPage = self.currentPageObs();
            history[response.currentPage+1] = response.offsetKey;
            currentAssignmentFilter = response.assignmentFilter || null;
            ko.postbox.publish(pageKey+'-recordsPaged', response);
            return response;
        }
    }
    function wrappedLoadingFunc(offsetKey) {
        pendingRequest = true;
        var params = {pageSize: PAGE_SIZE, offsetKey: offsetKey,
            idFilter: self.idFilterObs(), assignmentFilter: currentAssignmentFilter};
        return loadingFunc(params)
            .then(function(response) {
                // REMOVEME once this is offsetKey once again.
                if (response) {
                    response.offsetKey = response.offsetBy;
                }
                return response;
            })
            .then(addCurrentPage)
            .catch(utils.failureHandler());
    }
    function updateModel(response) {
        self.hasNextObs(!!response.offsetKey);
        self.hasPreviousObs(response.hasHistory);
        self.hasFirstPageObs(response.currentPage > 0);
        self.idFilterObs(response.idFilter || "");
        self.currentPageObs(response.currentPage); // this was added in addCurrentPage()
        self.showLoaderObs(false);
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
    self.firstPage = function(vm, event) {
        if (!pendingRequest) {
            clear();
            currentAssignmentFilter = null;
            self.idFilterObs("");
            self.showLoaderObs(true);
            wrappedLoadingFunc();
        }
    };
    self.previousPage = function(vm, event) {
        if (!pendingRequest) {
            history.pop(); // next page key
            history.pop(); // current page key
            var lastKey = history[history.length-1]; // the last page key
            self.currentPageObs(self.currentPageObs()-1);
            self.showLoaderObs(true);
            wrappedLoadingFunc(lastKey);
        }
    };
    self.nextPage = function(vm, event) {
        if (!pendingRequest) {
            var lastKey = history[history.length-1];        
            self.showLoaderObs(true);
            self.currentPageObs(self.currentPageObs()+1);
            wrappedLoadingFunc(lastKey);
        }
    };
    ko.postbox.subscribe(pageKey+'-firstPage', self.firstPage);
    ko.postbox.subscribe(pageKey+'-previousPage', self.previousPage);
    ko.postbox.subscribe(pageKey+'-nextPage', self.nextPage);

    self.assignFilter = function(vm, event) {
        clear();
        self.searchLoadingObs(true);
        currentAssignmentFilter = getValue(event.target.value);
        wrappedLoadingFunc();
        return true;
    };
    ko.postbox.subscribe(pageKey+'-recordsPaged', updateModel);
    // parent page is resetting, go back to first page, clear filters, etc.
    ko.postbox.subscribe(pageKey+'-refresh', self.firstPage);

    self.firstPage();
    document.querySelector("#assignEither").checked = true;
};