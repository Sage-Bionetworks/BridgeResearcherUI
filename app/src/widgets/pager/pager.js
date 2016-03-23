var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../utils');
var storeService = require('../../services/store_service');

var FIELDS = ['filterBox','offsetBy','pageSize','totalRecords','totalPages','currentPage'];

/**
 * @params loadingFunc - the function to call to load resources. The function takes the parameters 
 *      offsetBy, pageSize.
 * @params pageKey - a key to make the pagination on this table unique from other pagination on 
 *      the screen
 * @params top - mark one of the pagers as the top pager, and only that pager will take responsibility
 *      for calling for the first page of records. Also, search is hidden for the bottom control.
 */
module.exports = function(params) {
    var self = this;
    var loadingFunc = params.loadingFunc;

    var pageKey = params.pageKey;
    var pageSize = 50;
    var offsetBy = storeService.get(pageKey) || 0;
    var searchTerm = storeService.get(pageKey+'-filter') || '';
    
    utils.observablesFor(self, FIELDS);
    self.offsetByObs(offsetBy);
    self.pageSizeObs(pageSize);
    self.filterBoxObs(searchTerm);
    self.currentPageObs(Math.round(offsetBy/pageSize));
    self.searchLoading = ko.observable(false);
    self.pagerLoading = ko.observable(false);
    self.top = params.top;
    
    self.doSearch = function(vm, event) {
        if (event.keyCode === 13) {
            self.searchLoading(true);
            wrappedLoadingFunc(Math.round(self.currentPageObs()));
        }
    }

    self.previousPage = function(vm, event) {
        var page = self.currentPageObs() -1;
        if (page >= 0) {
            self.pagerLoading(true);
            wrappedLoadingFunc(page*pageSize);
        }
    }
    self.nextPage = function(vm, event) {
        var page = self.currentPageObs() +1;
        if (page <= self.totalPagesObs()-1) {
            self.pagerLoading(true);
            wrappedLoadingFunc(page*pageSize);
        }
    }
    self.firstPage = function(vm, event) {
        self.pagerLoading(true);
        wrappedLoadingFunc(0, vm, event);
    }
    self.lastPage = function(vm, event) {
        self.pagerLoading(true);
        wrappedLoadingFunc((self.totalPagesObs()-1)*pageSize);
    };
    
    // Postbox allows multiple instances of a paging control to stay in sync above
    // and below the table. The 'top' control is responsible for kicking off the 
    // first page of records.
    ko.postbox.subscribe(pageKey+'-recordsPaged', updateModel);

    function wrappedLoadingFunc(offsetBy, vm, event) {
        var searchTerm = self.filterBoxObs();
        loadingFunc(offsetBy, pageSize, searchTerm).then(function(response) {
            storeService.set(pageKey, offsetBy);
            storeService.set(pageKey+'-filter', searchTerm);
            ko.postbox.publish(pageKey+'-recordsPaged', response);
            updateModel(response);
            self.searchLoading(false);
            self.pagerLoading(false);
        }).catch(utils.errorHandler);
    }

    function updateModel(response) {
        self.offsetByObs(response.offsetBy);
        self.pageSizeObs(response.pageSize);
        self.totalRecordsObs(response.total);
        self.filterBoxObs(response.filter);
        self.currentPageObs(Math.round(response.offsetBy/response.pageSize));
        self.totalPagesObs( Math.ceil(response.total/response.pageSize) );
    }
    if (params.top) {
        wrappedLoadingFunc(offsetBy);
    }
};