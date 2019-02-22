import Binder from "../../binder";
import utils from "../../utils";
import ko from "knockout";

module.exports = function(params) {
  let self = this;
  let loadingFunc = params.vm.loadingFunc;
  let pendingRequest = false;

  self.nextOffset = null;
  self.history = [];

  new Binder(self)
    .obs("showLoader", false)
    .obs("hasPrevious", false)
    .obs("hasNext", false)
    .obs("currentPage", 0);

  function clear() {
    self.nextOffset = null;
    self.history = [];
    self.currentPageObs(0);
  }

  self.firstPage = function() {
    if (!pendingRequest) {
      clear();
      wrappedLoadingFunc(self.nextOffset);
    }
  };
  params.vm.callback = self.firstPage;

  ko.postbox.subscribe("page-refresh", refresh);

  self.previousPage = function() {
    if (!pendingRequest) {
      self.history.pop(); // next page key
      self.history.pop(); // current page key
      self.nextOffset = self.history[history.length - 1]; // the last page key
      wrappedLoadingFunc(self.nextOffset);
    }
  };

  self.nextPage = function() {
    if (!pendingRequest) {
      wrappedLoadingFunc(self.nextOffset);
    }
  };

  function refresh() {
    self.showLoaderObs(true);
    pendingRequest = true;
    let args = { offsetKey: self.history.pop() };

    loadingFunc(args)
      .then(function(response) {
        self.showLoaderObs(false);
        pendingRequest = false;
        return response;
      })
      .catch(utils.failureHandler());
  }

  function wrappedLoadingFunc(offsetKey) {
    self.showLoaderObs(true);
    pendingRequest = true;
    let args = { offsetKey: offsetKey };

    loadingFunc(args)
      .then(function(response) {
        if (response) {
          self.history.push(self.nextOffset);
          self.nextOffset = response.nextPageOffsetKey;
          self.hasPreviousObs(self.history.length > 1);
          self.hasNextObs(response.hasNext);
          self.currentPageObs(self.history.length - 1);
        }
        self.showLoaderObs(false);
        pendingRequest = false;
        return response;
      })
      .catch(utils.failureHandler());
  }
  self.firstPage();
};
