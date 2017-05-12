var utils = require('../../utils');
var bind = require('../../binder');

var pageSize = 25;

/**
 * @params loadingFunc - the function to call to load resources. The function takes the parameters 
 *      offsetBy, pageSize.
 */
module.exports = function(params) {
    var self = this;
    var loadingFunc = params.loadingFunc;

    bind(self)
        .obs('startDate', '')
        .obs('endDate', '')
        .obs('pageCount', 0)
        .obs('offsetBy', null)
        .obs('showLoader', false);

    self.itemsObs = params.itemsObs;

    self.clearStart = function() {
        self.startDateObs(null);
        self.offsetByObs(null);
        self.pageCountObs(0);
        wrappedLoadingFunc();
    };
    self.clearEnd = function() {
        self.endDateObs(null);
        self.offsetByObs(null);
        self.pageCountObs(0);
        wrappedLoadingFunc();
    };
    self.doCalSearch = function() {
        self.offsetByObs(null);
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

    function bothOrNeither(startDate, endDate) {
        return (startDate === null && endDate === null) || (startDate !== null && endDate !== null);
    }

    function wrappedLoadingFunc() {
        var startDate = self.startDateObs();
        var endDate = self.endDateObs();
        console.log("Straight from the observers:", typeof startDate, typeof endDate);
        var offsetBy = self.offsetByObs();

        if (!bothOrNeither(startDate, endDate)) {
            self.showLoaderObs(false);
            return; // can't do this, have to set both dates.
        }
        self.showLoaderObs(true);
        loadingFunc(offsetBy, pageSize, startDate, endDate).then(function(response) {
            response.pageCount = self.pageCountObs()+1;
            updateModel(response);
            self.showLoaderObs(false);
        }).catch(utils.failureHandler());
    }

    function updateModel(response) {
        if (response) {
            self.pageCountObs(response.pageCount);
            self.offsetByObs(response.offsetBy);
            self.startDateObs(response.scheduledOnStart);
            self.endDateObs(response.scheduledOnEnd);
        }
    }
    wrappedLoadingFunc();
};