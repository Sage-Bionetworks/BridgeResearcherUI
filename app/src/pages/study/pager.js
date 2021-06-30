import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import utils from "../../utils";

const PAGE_SIZE = 25;

/**
 * @params loadingFunc - the function to call to load resources. The function takes the parameters
 *      offsetBy, pageSize.
 * @params pageKey - a key to make the pagination on this table unique from other pagination on
 *      the screen
 * @params displayObs - an observer that holds display test left of the paging control (to 
 *      give a plain text description of the search).
 */
export default function pager(params) {
  let self = this;
  let pageKey = params.pageKey;
  let loadingFunc = params.loadingFunc;
  self.formatCount = fn.formatCount;

  self.displayObs = params.displayObs;

  new Binder(self)
    .obs("offsetBy")
    .obs("totalRecords")
    .obs("totalPages")
    .obs("currentPage", 1)
    .obs("searchLoading", false)
    .obs("showLoader", false)
    .obs("showSearch", false);

  self.doSearch = function(vm, event) {
    self.searchLoadingObs(true);
    wrappedLoadingFunc(Math.round(self.currentPageObs()));
  };
  self.previousPage = function(vm, event) {
    let page = self.currentPageObs() - 1;
    if (page >= 0) {
      self.showLoaderObs(true);
      wrappedLoadingFunc(page * PAGE_SIZE);
    }
  };
  self.nextPage = function(vm, event) {
    let page = self.currentPageObs() + 1;
    if (page <= self.totalPagesObs() - 1) {
      self.showLoaderObs(true);
      wrappedLoadingFunc(page * PAGE_SIZE);
    }
  };
  self.thisPage = function() {
    wrappedLoadingFunc(self.currentPageObs() * PAGE_SIZE);
  };
  self.firstPage = function(vm, event) {
    self.showLoaderObs(true);
    wrappedLoadingFunc(0, vm, event);
  };
  self.lastPage = function(vm, event) {
    self.showLoaderObs(true);
    wrappedLoadingFunc((self.totalPagesObs() - 1) * PAGE_SIZE);
  };
  self.openSearchDialog = function(vm, event) {
    utils.clearErrors();
    self.showSearchObs(!self.showSearchObs());
  };
  self.clear = function(vm, event) {
    self.offsetByObs(0);
    wrappedLoadingFunc(0);
  };

  function updateModel(response) {
    if (response) {
      let rp = response.requestParams;
      self.offsetByObs(rp.offsetBy);
      self.totalRecordsObs(response.total);
      self.currentPageObs(Math.round(rp.offsetBy / PAGE_SIZE));
      self.totalPagesObs(Math.ceil(response.total / PAGE_SIZE));
    }
  }

  ko.postbox.subscribe(pageKey, wrappedLoadingFunc.bind(self));

  function wrappedLoadingFunc(offsetBy) {
    let search = {offsetBy: offsetBy, pageSize: PAGE_SIZE};

    loadingFunc(search)
      .then(updateModel)
      .then(fn.handleStaticObsUpdate(self.searchLoadingObs, false))
      .then(fn.handleStaticObsUpdate(self.showLoaderObs, false))
      .catch(utils.failureHandler());
  }
  wrappedLoadingFunc(0);
};
