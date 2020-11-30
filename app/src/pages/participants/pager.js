import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import storeService from "../../services/store_service";
import utils from "../../utils";

const PAGE_SIZE = 25;

/**
 * @params loadingFunc - the function to call to load resources. The function takes the parameters
 *      offsetBy, pageSize.
 * @params pageKey - a key to make the pagination on this table unique from other pagination on
 *      the screen
 */
export default function pager(params) {
  let self = this;
  let pageKey = params.pageKey;
  let loadingFunc = params.loadingFunc;
  let { defaultStart, defaultEnd } = fn.getRangeInDays(-14, 0);

  let searchPanel = document.querySelector("#searchPanel");
  this.closeHandler = e => {
    if (self.showSearchObs() && !searchPanel.contains(e.target)) {
      e.stopPropagation();
      self.showSearchObs(false);
    }
  };
  document.body.addEventListener("click", this.closeHandler, true);

  let query = storeService.restoreQuery("p", "allOfGroups", "noneOfGroups");

  new Binder(self)
    .obs("emailFilter", query.emailFilter)
    .obs("phoneFilter", query.phoneFilter)
    .obs("startTime", query.startTime || defaultStart)
    .obs("endTime", query.endTime || defaultEnd)
    .obs("offsetBy", query.offsetBy)
    .obs("totalRecords")
    .obs("totalPages")
    .obs("currentPage", 1)
    .obs("searchLoading", false)
    .obs("showLoader", false)
    .obs("showSearch", false)
    .obs("formattedSearch", "")
    .obs("language", query.language)
    .obs("dataGroups[]")
    .obs("allOfGroups[]", query.allOfGroups)
    .obs("noneOfGroups[]", query.noneOfGroups)
    .obs("adminOnly", query.adminOnly);

  self.doSearch = function(vm, event) {
    self.searchLoadingObs(true);
    wrappedLoadingFunc(Math.round(self.currentPageObs()));
  };

  self.doCalSearch = function() {
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
    self.emailFilterObs(null);
    self.phoneFilterObs(null);
    self.startTimeObs(null);
    self.endTimeObs(null);
    self.offsetByObs(0);
    self.languageObs(null);
    self.allOfGroupsObs([]);
    self.noneOfGroupsObs([]);
    self.showSearchObs(false);
    self.adminOnlyObs(false);
    wrappedLoadingFunc(0);
  };

  function updateModel(response) {
    // If you're not a researcher, it can happen this gets called without a response.
    if (response) {
      let rp = response.requestParams;
      self.offsetByObs(rp.offsetBy);
      self.totalRecordsObs(response.total);
      self.emailFilterObs(rp.emailFilter);
      self.phoneFilterObs(rp.phoneFilter);
      self.startTimeObs(rp.startTime);
      self.endTimeObs(rp.endTime);
      self.languageObs(rp.language);
      self.allOfGroupsObs(rp.allOfGroups);
      self.noneOfGroupsObs(rp.noneOfGroups);
      self.currentPageObs(Math.round(rp.offsetBy / PAGE_SIZE));
      self.totalPagesObs(Math.ceil(response.total / PAGE_SIZE));
      self.adminOnlyObs(rp.adminOnly);
    }
  }

  ko.postbox.subscribe("page-refresh", wrappedLoadingFunc.bind(self));

  function wrappedLoadingFunc(offsetBy) {
    let search = {
      offsetBy: offsetBy,
      emailFilter: self.emailFilterObs(),
      phoneFilter: self.phoneFilterObs(),
      allOfGroups: self.allOfGroupsObs(),
      noneOfGroups: self.noneOfGroupsObs(),
      language: self.languageObs() ? self.languageObs() : null,
      startTime: self.startTimeObs(),
      endTime: self.endTimeObs(),
      adminOnly: self.adminOnlyObs()
    };
    if (fn.is(search.startTime, "Date")) {
      search.startTime.setHours(0, 0, 0, 0);
    }
    if (fn.is(search.endTime, "Date")) {
      search.endTime.setHours(23, 59, 59, 999);
    }
    storeService.persistQuery("p", search);
    self.showSearchObs(false);
    self.formattedSearchObs(fn.formatSearch(search));

    search.pageSize = PAGE_SIZE;
    loadingFunc(search)
      .then(updateModel)
      .then(fn.handleStaticObsUpdate(self.searchLoadingObs, false))
      .then(fn.handleStaticObsUpdate(self.showLoaderObs, false))
      .catch(utils.failureHandler());
  }
  // not sure why we would call a function to get this or even use binder for all of this
  serverService.getApp().then(app => {
    self.dataGroupsObs(app.dataGroups);
    wrappedLoadingFunc(0);
  });
};
pager.prototype.dispose = function() {
  document.body.removeEventListener("click", this.closeHandler, true);
};
