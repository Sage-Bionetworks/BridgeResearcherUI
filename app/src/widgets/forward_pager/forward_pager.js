import Binder from '../../binder';
import utils from '../../utils';

module.exports = function(params) {
    console.assert(params.vm, "loadingFunc not supplied");
    console.assert(params.vm.loadingFunc, "loadingFunc not supplied");
    console.assert(params.vm.callback, "callback not supplied");

    var self = this;
    var loadingFunc = params.vm.loadingFunc;
    var pendingRequest = false;

    var nextOffset = null;
    var history = [];

    new Binder(self)
        .obs('showLoader', false)
        .obs('hasPrevious', false)
        .obs('hasNext', false)
        .obs('currentPage', 0);

    function clear() {
        nextOffset = null;
        history = [];
        self.currentPageObs(0);
    }

    self.firstPage = function() {
        if (!pendingRequest) {
            clear();
            wrappedLoadingFunc(nextOffset);
        }
    };
    params.vm.callback = self.firstPage;

    self.previousPage = function() {
        if (!pendingRequest) {
            history.pop(); // next page key
            history.pop(); // current page key
            nextOffset = history[history.length-1]; // the last page key
            wrappedLoadingFunc(nextOffset);
        }
    };
    self.nextPage = function() {
        if (!pendingRequest) {
            wrappedLoadingFunc(nextOffset);
        }
    };

    function wrappedLoadingFunc(offsetKey) {
        self.showLoaderObs(true);
        pendingRequest = true;
        var args = {offsetKey: offsetKey};

        loadingFunc(args).then(function(response) {
            if (response) {
                history.push(nextOffset);
                nextOffset = response.offsetKey;
                self.showLoaderObs(false);
                self.hasPreviousObs(history.length > 1);
                self.hasNextObs(response.hasNext);
                self.currentPageObs(history.length-1);
                pendingRequest = false;
            }
            return response;
        }).catch(utils.failureHandler());
    }
    self.firstPage();
};