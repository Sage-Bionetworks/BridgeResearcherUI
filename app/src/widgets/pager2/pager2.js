import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";

export default class CursorPager {
  constructor(params) {
    this.prefix = params.prefix;
    this.loadingFunc = params.loadingFunc;
    this.pageSize = params.pageSize || 25;
    
    this.formatCount = fn.formatCount;
    
    new Binder(this)
      .bind("offsetBy", 0)
      .bind("totalRecords", 0)
      .bind("totalPages", 0)
      .bind("showLoader", false)
      .bind("currentPage", 0);

    ko.postbox.subscribe(`${this.prefix}-refresh`, 
      () => this.wrappedLoadingFunc(0));
  }
  previousPage() {
    let page = this.currentPageObs() - 1;
    if (page >= 0) {
      this.wrappedLoadingFunc(page * this.pageSize);
    }
  }
  nextPage() {
    let page = this.currentPageObs() + 1;
    if (page <= this.totalPagesObs() - 1) {
      this.wrappedLoadingFunc(page * this.pageSize);
    }
  }
  firstPage() {
    this.wrappedLoadingFunc(0);
  }
  lastPage() {
    this.wrappedLoadingFunc((this.totalPagesObs() - 1) * this.pageSize);
  }
  wrappedLoadingFunc(offsetBy) {
    this.showLoaderObs(true);
    this.loadingFunc(offsetBy).then(response => {
      console.log(response);
      let rp = response.requestParams;
      this.offsetByObs(rp.offsetBy);
      this.totalRecordsObs(response.total);
      this.currentPageObs(Math.round(rp.offsetBy / this.pageSize));
      this.totalPagesObs(Math.ceil(response.total / this.pageSize));
      // This deals with the case of deleting all the items on a page, such that
      // you are past the current end of records.
      if (this.currentPageObs() > (this.totalPagesObs()-1)) {
        this.previousPage();
      }
      this.showLoaderObs(false);
      return response;
    });
  }
}

