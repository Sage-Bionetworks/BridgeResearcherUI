import fn from '../../functions';
import ko from 'knockout';
import Promise from "bluebird";
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

const PAGE_OPTS = {pageSize: 8, adminOnly: false, predicate: "or"};

function formatAccount(acct) {
  acct.studyIds = acct.studyIds || [];
  return acct;
}

export default class AddEnrollmentDialog {
  constructor(params) {
    this.studyId = params.studyId;
    this.searchObs = ko.observable('');
    this.externalIdObs = ko.observable('');
    this.closeDialog = params.closeFunc;
    fn.copyProps(this, fn, "formatIdentifiers", "formatNameAsFullLabel");

    tables.prepareTable(this, {
      name: "participant",
      id: "add_enrollment",
      refresh: () => ko.postbox.publish("page-refresh")
    });

    this.load = this.load.bind(this);
    this.search = this.search.bind(this);

    serverService.searchAccountSummaries(PAGE_OPTS)
      .then(this.load)
      .catch(utils.failureHandler({ id: "add_enrollment" }));
  }
  addAndClose(vm, event) {
    utils.startHandler(vm, event);
    let adds = this.itemsObs().filter(acct => acct.checkedObs());
    Promise.each(adds, (acct) => serverService.enroll(this.studyId, acct.id, this.externalIdObs()))
      .then(this.closeDialog)
      .catch(utils.failureHandler({ id: "add_enrollment" }));
  }
  search(event) {
    utils.startHandler(this, event, "icon");
    let s = this.searchObs().trim();
    let params = Object.assign({emailFilter: s, phoneFilter: s, externalIdFilter: s}, PAGE_OPTS);
    serverService.searchAccountSummaries(params)
      .then(this.load)
      .then(utils.successHandler(this, event))
      .catch(utils.failureHandler({ id: "add_enrollment" }));
  }
  load(response) {
    response.items = response.items.map(formatAccount);
    this.itemsObs(response.items);
    if (response.items.length === 0) {
      this.recordsMessageObs("There are no user accounts, or none that match the filter.");
    }
    return response;
  }
}
