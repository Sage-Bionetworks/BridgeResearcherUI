import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import storeService from "../../services/store_service";

export default function pager(params) {
  let prefix = params.prefix;
  let postLoadFunc = params.postLoadFunc;
  let pageSize = params.pageSize || 50;

  let self = this;
  let query = storeService.restoreQuery(prefix) || {};
  query.includeDeleted = query.includeDeleted || false;
  query.pageSize = query.pageSize || pageSize;
  query.offsetBy = query.offsetBy || 0;

  new Binder(self)
    .bind("offsetBy", 0)
    .bind("totalRecords", 0)
    .bind("totalPages", 0)
    .bind("showLoader", false)
    .bind("currentPage", 0);

  self.formatCount = fn.formatCount;

  self.previousPage = function() {
    let page = self.currentPageObs() - 1;
    if (page >= 0) {
      self.showLoaderObs(true);
      query.offsetBy = page * pageSize;
      ko.postbox.publish(`${prefix}-refresh`, query);
    }
  };
  self.nextPage = function() {
    let page = self.currentPageObs() + 1;
    if (page <= self.totalPagesObs() - 1) {
      self.showLoaderObs(true);
      query.offsetBy = page * pageSize;
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
    query.offsetBy = (self.totalPagesObs() - 1) * pageSize;
    ko.postbox.publish(`${prefix}-refresh`, query);
  };

  postLoadFunc((response) => {
    storeService.persistQuery(prefix, query);
    let rp = response.requestParams;
    self.offsetByObs(rp.offsetBy);
    self.totalRecordsObs(response.total);
    self.currentPageObs(Math.round(rp.offsetBy / pageSize));
    self.totalPagesObs(Math.ceil(response.total / pageSize));
    self.showLoaderObs(false);
    // This deals with the case of deleting all the items on a page, such that
    // you are past the current end of records.
    if (self.currentPageObs() > (self.totalPagesObs()-1)) {
      self.previousPage();
    }
    return response;
  });
  setTimeout(() => ko.postbox.publish(`${prefix}-refresh`, query), 1);
};
