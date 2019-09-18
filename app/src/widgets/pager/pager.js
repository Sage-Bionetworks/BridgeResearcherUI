import "knockout-postbox";
import Binder from "../../binder";
import ko from "knockout";
import storeService from "../../services/store_service";

const PAGE_SIZE = 25;

export default function pager(params) {
  let prefix = params.prefix;
  let postLoadFunc = params.postLoadFunc;

  let self = this;
  let query = storeService.restoreQuery(prefix);
  if (!query || !query.pageSize) {
    query = {includeDeleted:false, pageSize: PAGE_SIZE, offsetBy: 0};
  }

  new Binder(self)
    .bind("offsetBy", 0)
    .bind("totalRecords", 0)
    .bind("totalPages", 0)
    .bind("showLoader", false)
    .bind("currentPage", 0)

  self.previousPage = function() {
    let page = self.currentPageObs() - 1;
    if (page >= 0) {
      self.showLoaderObs(true);
      query.offsetBy = page * PAGE_SIZE;
      ko.postbox.publish(`${prefix}-refresh`, query);
    }
  };
  self.nextPage = function() {
    let page = self.currentPageObs() + 1;
    if (page <= self.totalPagesObs() - 1) {
      self.showLoaderObs(true);
      query.offsetBy = page * PAGE_SIZE;
      ko.postbox.publish(`${prefix}-refresh`, query);
    }
  };
  self.firstPage = function() {
    self.showLoaderObs(true);
    query.offsetBy = 0;
    ko.postbox.publish(`${prefix}-refresh`, query);
  };
  self.lastPage = function() {
    self.showLoaderObs(true);
    query.offsetBy = (self.totalPagesObs() - 1) * PAGE_SIZE;
    ko.postbox.publish(`${prefix}-refresh`, query);
  };

  postLoadFunc((response) => {
    storeService.persistQuery(prefix, query);
    let rp = response.requestParams;
    self.offsetByObs(rp.offsetBy);
    self.totalRecordsObs(response.total);
    self.currentPageObs(Math.round(rp.offsetBy / PAGE_SIZE));
    self.totalPagesObs(Math.ceil(response.total / PAGE_SIZE));
    self.showLoaderObs(false);
    // This deals with the case of deleting all the items on a page, such that
    // you are past the current end of records.
    if (self.currentPageObs() > (self.totalPagesObs()-1)) {
      self.previousPage();
    }
    return response;
  });

  ko.postbox.publish(`${prefix}-refresh`, query);
};
