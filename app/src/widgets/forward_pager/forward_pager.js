import Binder from '../../binder';
import utils from '../../utils';

module.exports = function(params) {
    let self = this;
    let loadingFunc = params.vm.loadingFunc;
    let pendingRequest = false;

    let nextOffset = null;
    let history = [];

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
        console.log("nextOffset", nextOffset);
        self.showLoaderObs(true);
        pendingRequest = true;
        let args = {offsetKey: offsetKey};

        loadingFunc(args).then(function(response) {
            if (response) {
                history.push(nextOffset);
                nextOffset = response.nextPageOffsetKey;
                console.log("response.nextPageOffsetKey", response.nextPageOffsetKey);
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