import BaseStudy from "./base_study";
import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import storeService from "../../services/store_service";
import tables from "../../tables";
import utils from "../../utils";

const PAGE_KEY = 'adh-refresh';

function decode(str = '') {
  return decodeURIComponent(str).replace('+', ' ');
}

export default class StudyAdherence extends BaseStudy {
  constructor(params) {
    super(params, 'adherence');
    this.studyId = params.studyId;
    this.study = null;
  
    fn.copyProps(this, fn, 'formatNameAsFullLabel');

    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;
    this.search = storeService.restoreQuery("adh", "labelFilters", "progressionFilters");

    this.binder
      .obs('label')
      .obs('formattedSearch')
      .obs('test')
      .obs('id')
      .obs('range')
      .obs('unstarted')
      .obs('inProgress')
      .obs('done')
      .obs('report', {});
    this.updateObservers();

    tables.prepareTable(this, {
      name: "weekly adherence report",
      type: "Weekly Adherence Report",
      id: "adherence",
      refresh: () => ko.postbox.publish(PAGE_KEY, 0)
    });
    this.loadingFunc = this.loadingFunc.bind(this);
    super.load().then(() => ko.postbox.publish(PAGE_KEY, 0));
  }
  updateObservers() {
    let range = null;
    if (this.search.adherenceMin || this.search.adherenceMax) {
      range = this.search.adherenceMin || 0;
      range += '-';
      range += this.search.adherenceMax || 100;
    }
    let label = this.search.labelFilters ? decode(this.search.labelFilters[0]) : null;
    let pf = this.search.progressionFilters || [];
    this.binder
      .obs('label', label)
      .obs('test', this.search.testFilter)
      .obs('id', decode(this.search.idFilter))
      .obs('range', range)
      .obs('unstarted', pf.includes('unstarted'))
      .obs('inProgress', pf.includes('in_progress'))
      .obs('done', pf.includes('done'));
  }
  formatSearch() {
    let array = [];
    if (this.idObs()) {
      array.push(`identifier includes “${this.idObs()}”`);
    }
    if (this.labelObs()) {
      array.push(`labels include “${this.labelObs()}”`);
    }
    if (this.testObs() && this.testObs() !== 'both') {
      array.push(`accounts are ${this.testObs()} accounts`);
    }
    let states = [];
    if (this.unstartedObs()) states.push('unstarted');
    if (this.inProgressObs()) states.push('in progress');
    if (this.doneObs()) states.push('done');
    if (states.length) {
      array.push(`study is ${states.join(', ')} for user`);
    }
    let range = this.rangeObs();
    if (range !== '0-100' && /^\d{1,3}-\d{1,3}$/.test(range)) {
      array.push(`adherence is in range ${range}%`);
    } else if (/^\d{1,3}$/.test(range)) {
      array.push(`adherence is in range 0-${range}%`); 
    }
    if (array.length) {
      return 'Search for all reports where ' + fn.formatList(array, "and", ";")
    }
    return 'Search for all reports';
  }
  updateSearch() {
    let search = {};
    if (this.testObs() !== '') {
      search.testFilter = this.testObs();
    }
    let range = this.rangeObs();
    if (/^\d{1,3}-\d{1,3}$/.test(range)) {
      let parts = range.split('-');
      search.adherenceMin = parseInt(parts[0]);
      search.adherenceMax = parseInt(parts[1]);
    } else if (/^\d{1,3}$/.test(range)) {
      search.adherenceMin = 0;
      search.adherenceMax = parseInt(range);
    } else {
      this.rangeObs(null);
    }
    if (this.labelObs()) {
      search.labelFilters = [this.labelObs()];
    }
    if (this.idObs()){ 
      search.idFilter = this.idObs();
    }
    let pf = [];
    if (this.unstartedObs()) pf.push('unstarted');
    if (this.inProgressObs()) pf.push('in_progress');
    if (this.doneObs()) pf.push('done');
    if (pf.length) {
      search.progressionFilters = pf;
    }
    this.search = search;
    return search;
  }
  loadingFunc(offsetBy) {
    this.search = this.updateSearch();
    this.search.offsetBy = offsetBy;

    storeService.persistQuery("adh", this.search);
    this.formattedSearchObs(this.formatSearch());

    utils.clearErrors();
    return serverService.getStudyParticipantAdherenceReports(this.studyId, this.search)
      .then(this.postLoadPagerFunc)
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .catch(this.failureHandler);
  }
  doFormSearch(vm, event) {
    if (event.keyCode === 13)  {
      ko.postbox.publish(PAGE_KEY, 0);
    }
  }
  searchButton() {
    ko.postbox.publish(PAGE_KEY, this.search.offsetBy);
  }
  clear() {
    this.testObs(null);
    this.labelObs(null);
    this.rangeObs(null);
    this.formattedSearchObs(null);
    this.idObs(null);
    this.unstartedObs(false);
    this.inProgressObs(false);
    this.doneObs(false);
    ko.postbox.publish(PAGE_KEY, 0);
  }
}