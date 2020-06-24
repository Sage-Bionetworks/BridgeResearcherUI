import Binder from '../../binder';
import fn from '../../functions';
import Promise from "bluebird";
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

export default function(params) {
  const self = this;

  new Binder(self).obs('disabled', true)
    .obs('email');

  self.closeDialog = params.closeFunc;
  fn.copyProps(self, fn, "formatIdentifiers", "formatNameAsFullLabel");

  tables.prepareTable(self, {
    name: "participant",
    id: "add_member",
    refresh: () => ko.postbox.publish("page-refresh")
  });

  self.addAndClose = (vm, event) => {
    utils.startHandler(vm, event);

    let fn = (acct) => {
      if (acct.checkedObs()) {
        serverService.addOrgMember(params.orgId, acct.id)
      }
    };
    Promise.each(self.itemsObs(), (acct) => fn(acct))
      .then(params.closeFunc)
      .catch(utils.failureHandler({ id: "add_member" }));
  };

  self.search = function() {
    serverService.searchAccountSummaries({emailFilter: self.emailObs()})
      .then(load)
      .catch(utils.failureHandler({ id: "add_member" }));
  };

  function load(response) {
    response.items = response.items.map(function(item) {
      item.substudyIds = item.substudyIds || [];
      if (item.phone) {
        item.phone = fn.flagForRegionCode(item.phone.regionCode) + " " + item.phone.nationalFormat;
      } else {
        item.phone = "";
      }
      return item;
    });
    self.itemsObs(response.items);
    if (response.items.length === 0) {
      self.recordsMessageObs("There are no user accounts, or none that match the filter.");
    }
    return response;
  }

  serverService.searchAccountSummaries({pageSize: 100})
      .then(load)
      .catch(utils.failureHandler({ id: "add_member" }));
}
