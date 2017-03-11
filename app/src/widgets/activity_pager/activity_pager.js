var ko = require('knockout');
require('knockout-postbox');
var utils = require('../../utils');
var bind = require('../../binder');

var pageSize = 25;

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
    self.top = params.top;
    var pageKey = params.pageKey;
    var loadingFunc = params.loadingFunc;
    var query = {};

    bind(self)
        .obs('startDate', '')
        .obs('endDate', '')
        .obs('pageCount', 0)
        .obs('offsetBy', null)
        .obs('showLoader', false);

    self.clearStart = function() {
        self.startDateObs(null);
        self.pageCountObs(0);
        wrappedLoadingFunc();
    };
    self.clearEnd = function() {
        self.endDateObs(null);
        self.pageCountObs(0);
        wrappedLoadingFunc();
    };
    self.doCalSearch = function() {
        self.pageCountObs(0);
        wrappedLoadingFunc();
    };
    self.firstPage = function(vm, event) {
        self.offsetByObs(null);
        self.pageCountObs(0);
        wrappedLoadingFunc();
    };
    self.nextPage = function(vm, event) {
        if (self.offsetByObs() !== null) {
            wrappedLoadingFunc();
        }
    };
    
    // Postbox allows multiple instances of a paging control to stay in sync above
    // and below the table. The 'top' control is responsible for kicking off the 
    // first page of records.
    ko.postbox.subscribe(pageKey+'-recordsPaged', updateModel);
    ko.postbox.subscribe(pageKey+'-refresh', self.thisPage);

    function bothOrNeither(startDate, endDate) {
        if (startDate === null && endDate === null) {
            return true;
        }
        if (startDate !== null && endDate !== null) {
            return true;
        }
        return false;
    }

    function wrappedLoadingFunc() {
        var startDate = self.startDateObs();
        var endDate = self.endDateObs();
        var offsetBy = self.offsetByObs();
        console.log(startDate, endDate);

        if (!bothOrNeither(startDate, endDate)) {
            self.showLoaderObs(false);
            return; // can't do this, have to set both dates.
        }
        self.showLoaderObs(true);
        loadingFunc(offsetBy, pageSize, startDate, endDate).then(function(response) {
            response.pageCount = self.pageCountObs()+1;
            ko.postbox.publish(pageKey+'-recordsPaged', response);
            // NOTE: this is a duplicate call because ^^^ is going to call updateModel.
            // TODO: change the participant list grid because this code comes from there.
            //updateModel(response);
            self.showLoaderObs(false);
        }).catch(utils.failureHandler());
    }

    function updateModel(response) {
        if (response) {
            self.pageCountObs(response.pageCount);
            self.offsetByObs(response.offsetBy);
            self.startDateObs(response.scheduledOnOrAfter);
            self.endDateObs(response.scheduledOnOrBefore);
        }
    }
    if (params.top) {
        wrappedLoadingFunc();
    }
};