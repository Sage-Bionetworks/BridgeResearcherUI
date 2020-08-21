import Binder from '../../binder';
import fn from '../../functions';
import Promise from "bluebird";
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

export default function(params) {
  const self = this;

  self.closeDialog = params.closeFunc;

  tables.prepareTable(self, {
    name: "available organization",
    id: "add_sponsor",
    refresh: () => ko.postbox.publish("page-refresh")
  });

  self.addAndClose = (vm, event) => {
    utils.startHandler(vm, event);

    let fn = (org) => serverService.addSponsor(params.studyId, org.identifier);

    let adds = self.itemsObs().filter(acct => acct.checkedObs());

    Promise.each(adds, (org) => fn(org))
      .then(params.closeFunc)
      .catch(utils.failureHandler({ id: "add_sponsor" }));
  };

  self.sponsorIds = new Set();

  serverService.getSponsors(params.studyId, {offsetBy: 0, pageSize: 100})
    .then((response) => self.sponsorIds = new Set(response.items.map(org => org.identifier)))
    .then(() => serverService.getOrganizations(0, 100))
    .then((response) => {
      response.items = response.items.filter(item => !self.sponsorIds.has(item.identifier));
      return response;
    })
    .then(fn.handleObsUpdate(self.itemsObs, "items"))
    .catch(utils.failureHandler({ id: "add_sponsor" }));
}
