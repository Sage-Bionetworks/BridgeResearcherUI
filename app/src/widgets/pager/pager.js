var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../utils');
var storeService = require('../../services/store_service');

var FIELDS = ['offsetBy','pageSize','totalRecords','totalPages','currentPage'];

/**
 * @params loadingFunc - the function to call to load resources. The function takes the parameters 
 *      offsetBy, pageSize.
 * @params pageKey - a key to make the pagination on this table unique from other pagination on 
 *      the screen
 * @params top - mark one of the pagers as the top pager, and only that pager will take responsibility
 *      for calling for the first page of records.
 * @params filterObs
 *      model observer for any filter information added to filter this page.
 */
module.exports = function(params) {
    var self = this;
    var loadingFunc = params.loadingFunc;
    
    var pageKey = params.pageKey;
    var offsetBy = storeService.get(pageKey) || 0;
    var pageSize = 50;
    
    if (params.filterObs) {
        params.filterObs.extend({ rateLimit: 800 });
        params.filterObs.subscribe(function(newValue) {
            wrappedLoadingFunc(Math.round(self.currentPageObs()), null, null);   
        });
    }

    utils.observablesFor(self, FIELDS);
    self.offsetByObs(offsetBy);
    self.pageSizeObs(pageSize);
    self.currentPageObs(Math.round(offsetBy/pageSize));

    self.previousPage = function(vm, event) {
        var page = self.currentPageObs() -1;
        if (page >= 0) {
            wrappedLoadingFunc(page*pageSize, vm, event);
        }
    }
    self.nextPage = function(vm, event) {
        var page = self.currentPageObs() +1;
        if (page <= self.totalPagesObs()-1) {
            wrappedLoadingFunc(page*pageSize, vm, event);
        }
    }
    self.firstPage = function(vm, event) {
        wrappedLoadingFunc(0, vm, event);
    }
    self.lastPage = function(vm, event) {
        wrappedLoadingFunc((self.totalPagesObs()-1)*pageSize, vm, event);
    };
    
    // Postbox allows multiple instances of a paging control to stay in sync above
    // and below the table. The 'top' control is responsible for kicking off the 
    // first page of records.
    ko.postbox.subscribe(pageKey+'-recordsPaged', updateModel);

    function wrappedLoadingFunc(offsetBy, vm, event) {
        var evt;
        if (vm) {
            evt = {target: event.target.parentNode};
            utils.startHandler(vm, evt);
        }
        var p = loadingFunc(offsetBy, pageSize).then(function(response) {
            storeService.set(pageKey, offsetBy);
            ko.postbox.publish(pageKey+'-recordsPaged', response);
            updateModel(response);
        });
        if (vm) {
            p.then(utils.successHandler(vm, evt))
            .catch(utils.failureHandler(vm, evt));
        }
    }

    function updateModel(response) {
        self.offsetByObs(response.offsetBy);
        self.pageSizeObs(response.pageSize);
        self.totalRecordsObs(response.total);
        self.currentPageObs(Math.round(response.offsetBy/response.pageSize));
        self.totalPagesObs( Math.ceil(response.total/response.pageSize) );
    }
    if (params.top) {
        wrappedLoadingFunc(offsetBy);
    }
};