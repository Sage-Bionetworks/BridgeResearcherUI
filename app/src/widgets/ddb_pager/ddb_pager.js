var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../utils');
var bind = require('../../binder');

var pageSize = 25;

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
    var currentAssignmentFilter = null;
    self.top = params.top;
    self.showCredentials = (typeof params.showCredentials === "boolean") ? 
        params.showCredentials : true;

    bind(self)
        .obs('idFilter')
        .obs('offsetKey')
        .obs('pageKey')
        .obs('pageSize')
        .obs('totalRecords')
        .obs('currentPage')
        .obs('totalPages')
        .obs('searchLoading')
        .obs('pagerLoading')
        .obs('priorOffsetKeys[]', []);
    
    function clear() {
        self.offsetKeyObs(null);
        self.currentPageObs(0);
        self.priorOffsetKeysObs([]);
    }

    self.doSearch = function(vm, event) {
        if (event.keyCode === 13) {
            clear();
            self.searchLoadingObs(true);
            wrappedLoadingFunc();
        }
    };
    
    self.firstPage = function(vm, event) {
        clear();
        currentAssignmentFilter = null;
        self.idFilterObs("");
        self.pagerLoadingObs(true);
        wrappedLoadingFunc();
    };
    self.previousPage = function(vm, event) {
        if (self.priorOffsetKeysObs().length > 0) {
            var offsetKey = self.priorOffsetKeysObs.pop();
            self.offsetKeyObs(offsetKey);
            self.pagerLoadingObs(true);
            self.currentPageObs(self.currentPageObs()-1);
            wrappedLoadingFunc().then(function() {
                
            });
        }
    };
    self.nextPage = function(vm, event) {
        if (self.offsetKeyObs() !== null) {
            self.pagerLoadingObs(true);
            self.currentPageObs(self.currentPageObs()+1);
            wrappedLoadingFunc().then(function() {
                self.priorOffsetKeysObs.push(self.offsetKeyObs());
            });
        }
    };
    
    function getValue(value) {
        if (value === 'true') {
            return 'true';
        } else if (value === 'false') {
            return 'false';
        }
        return null;
    }
    
    self.assignFilter = function(vm, event) {
        clear();
        currentAssignmentFilter = getValue(event.target.value);
        wrappedLoadingFunc();
        return true;
    };
    // Postbox allows multiple instances of a paging control to stay in sync above
    // and below the table. The 'top' control is responsible for kicking off the 
    // first page of records.
    ko.postbox.subscribe(pageKey+'-recordsPaged', updateModel);
    ko.postbox.subscribe(pageKey+'-refresh', self.firstPage);

    function wrappedLoadingFunc() {
        var offsetKey = self.offsetKeyObs();
        var idFilter = self.idFilterObs();
        var requestAssign = (self.showCredentials) ? currentAssignmentFilter : true;

        return loadingFunc({
            offsetKey: offsetKey,
            pageSize: pageSize,
            idFilter: idFilter,
            assignmentFilter: requestAssign
        }).then(function(response) {
            response.currentPage = self.currentPageObs();
            ko.postbox.publish(pageKey+'-recordsPaged', response);
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
        self.currentPageObs(response.currentPage); // this was added by the component.
        currentAssignmentFilter = response.assignmentFilter || null;
        self.totalPagesObs( Math.ceil(response.total/response.pageSize) );
    }
    if (params.top) {
        self.firstPage();
    }
    // why. why? why?!?!?!?!?!?!?!?
    document.querySelector("#assignEither").checked = true;
};