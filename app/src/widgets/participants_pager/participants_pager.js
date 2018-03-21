import Binder from '../../binder';
import fn from '../../functions';
import storeService from '../../services/store_service';
import utils from '../../utils';

const pageSize = 25;

/**
 * @params loadingFunc - the function to call to load resources. The function takes the parameters 
 *      offsetBy, pageSize.
 * @params pageKey - a key to make the pagination on this table unique from other pagination on 
 *      the screen
 */
module.exports = function(params) {
    var self = this;
    var pageKey = params.pageKey;
    var loadingFunc = params.loadingFunc;
    var query = storeService.restoreQuery(pageKey);
    var offsetBy = query.offsetBy;

    var {defaultStart, defaultEnd} = fn.getRangeInDays(-14, 0);
    var start = query.startTime ? new Date(query.startTime) : defaultStart;
    var end = query.endTime ? new Date(query.endTime) : defaultEnd;

    new Binder(self)
        .obs('emailFilter', query.emailFilter)
        .obs('phoneFilter', query.phoneFilter)
        .obs('startTime', start)
        .obs('endTime', end)
        .obs('offsetBy', offsetBy)
        .obs('pageSize', pageSize)
        .obs('totalRecords')
        .obs('totalPages')
        .obs('currentPage', 1)
        .obs('searchLoading', false)
        .obs('showLoader', false);
    
    self.doSearch = function(vm, event) {
        if (event.keyCode === 13) {
            self.searchLoadingObs(true);
            wrappedLoadingFunc(Math.round(self.currentPageObs()));
        }
    };

    self.doCalSearch = function() {
        self.searchLoadingObs(true);
        wrappedLoadingFunc(Math.round(self.currentPageObs()));
    };
    self.previousPage = function(vm, event) {
        var page = self.currentPageObs() -1;
        if (page >= 0) {
            self.showLoaderObs(true);
            wrappedLoadingFunc(page*pageSize);
        }
    };
    self.nextPage = function(vm, event) {
        var page = self.currentPageObs() +1;
        if (page <= self.totalPagesObs()-1) {
            self.showLoaderObs(true);
            wrappedLoadingFunc(page*pageSize);
        }
    };
    self.thisPage = function() {
        wrappedLoadingFunc(self.currentPageObs()*pageSize);
    };
    self.firstPage = function(vm, event) {
        self.showLoaderObs(true);
        wrappedLoadingFunc(0, vm, event);
    };
    self.lastPage = function(vm, event) {
        self.showLoaderObs(true);
        wrappedLoadingFunc((self.totalPagesObs()-1)*pageSize);
    };

    function makeDate(date) {
        // I don't know why this ends up sending an empty array, but it does.
        if (date) {
            return new Date(date).toISOString();
        }
        return null;
    }
    function updateModel(response) {
        // If you're not a researcher, it can happen this gets called without a response.
        if (response) {
            var rp = response.requestParams;
            self.offsetByObs(rp.offsetBy);
            self.pageSizeObs(rp.pageSize);
            self.totalRecordsObs(response.total);
            self.emailFilterObs(rp.emailFilter);
            self.phoneFilterObs(rp.phoneFilter);
            self.startTimeObs(rp.startTime);
            self.endTimeObs(rp.endTime);
            self.currentPageObs(Math.round(rp.offsetBy/rp.pageSize));
            self.totalPagesObs( Math.ceil(response.total/rp.pageSize) );
        }
    }
    
    function wrappedLoadingFunc(offsetBy, vm, event) {
        var emailFilter = self.emailFilterObs();
        var phoneFilter = self.phoneFilterObs();
        var startTime = makeDate(self.startTimeObs());
        var endTime = null;
        if (self.endTimeObs()) {
            var date = new Date(self.endTimeObs());
            date.setDate(date.getDate()+1);
            endTime = makeDate(date);
        }
        storeService.persistQuery(pageKey, {
            emailFilter, phoneFilter, startTime, endTime, offsetBy});

        loadingFunc(offsetBy, pageSize, emailFilter, phoneFilter, startTime, endTime)
            .then(updateModel)
            .then(fn.handleStaticObsUpdate(self.searchLoadingObs, false))
            .then(fn.handleStaticObsUpdate(self.showLoaderObs, false))
            .catch(utils.failureHandler());
    }
    wrappedLoadingFunc(offsetBy);
};