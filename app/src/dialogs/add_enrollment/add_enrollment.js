import Binder from '../../binder';
import fn from '../../functions';
import ko from 'knockout';
import Promise from "bluebird";
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

const PAGE_OPTS = {pageSize: 100, adminOnly: false};

export default function(params) {
  const self = this;

  new Binder(self).obs('email');

  self.closeDialog = params.closeFunc;
  fn.copyProps(self, fn, "formatIdentifiers", "formatNameAsFullLabel");

  self.externalIdObs = ko.observable('');

  tables.prepareTable(self, {
    name: "participant",
    id: "add_enrollment",
    refresh: () => ko.postbox.publish("page-refresh")
  });

  self.addAndClose = (vm, event) => {
    utils.startHandler(vm, event);

    let fn = (acct) => serverService.enroll(params.studyId, acct.id, self.externalIdObs());

    let adds = self.itemsObs().filter(acct => acct.checkedObs());

    Promise.each(adds, (acct) => fn(acct))
      .then(params.closeFunc)
      .catch(utils.failureHandler({ id: "add_enrollment" }));
  };

  self.search = function() {
    let params = Object.assign({emailFilter: self.emailObs()}, PAGE_OPTS);
    serverService.searchAccountSummaries(params)
      .then(load)
      .catch(utils.failureHandler({ id: "add_enrollment" }));
  };

  function formatAccount(acct) {
    acct.studyIds = acct.studyIds || [];
    return acct;
  }

  function load(response) {
    response.items = response.items.map(formatAccount);
    self.itemsObs(response.items);
    if (response.items.length === 0) {
      self.recordsMessageObs("There are no user accounts, or none that match the filter.");
    }
    return response;
  }

  serverService.searchAccountSummaries(PAGE_OPTS)
      .then(load)
      .catch(utils.failureHandler({ id: "add_enrollment" }));
}
