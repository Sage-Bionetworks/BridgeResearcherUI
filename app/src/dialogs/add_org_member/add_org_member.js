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

export default class AddOrgMember {
  constructor(params) {

    this.searchObs = ko.observable();
    this.closeDialog = params.closeFunc;
    this.orgId = params.orgId;
    fn.copyProps(this, fn, "formatIdentifiers", "formatNameAsFullLabel");
  
    tables.prepareTable(this, {
      name: "participant",
      id: "add_member",
      refresh: () => ko.postbox.publish("page-refresh")
    });

    this.search = this.search.bind(this);
    this.load = this.load.bind(this);

    serverService.searchUnassignedAdminAccounts(PAGE_OPTS)
      .then(this.load)
      .catch(utils.failureHandler({ id: "add_member" }));
  }
  addAndClose(vm, event) {
    utils.startHandler(vm, event);

    let fn = (acct) => serverService.addOrgMember(this.orgId, acct.id);
    let adds = this.itemsObs().filter(acct => acct.checkedObs());
    Promise.each(adds, (acct) => fn(acct))
      .then(this.closeDialog)
      .catch(utils.failureHandler({ id: "add_member" }));
  }
  search() {
    utils.startHandler(this, event, "icon");
    let s = this.searchObs().trim();
    let params = Object.assign({emailFilter: s, phoneFilter: s, externalIdFilter: s}, PAGE_OPTS);
    serverService.searchUnassignedAdminAccounts(params)
      .then(this.load)
      .then(utils.successHandler(this, event))
      .catch(utils.failureHandler({ id: "add_member" }));
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
