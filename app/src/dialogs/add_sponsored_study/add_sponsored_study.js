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
    name: "study",
    id: "add_sponsored_study",
    refresh: () => ko.postbox.publish("page-refresh")
  });

  self.addAndClose = (vm, event) => {
    utils.startHandler(vm, event);

    let fn = (study) => serverService.addSponsor(study.id, params.orgId);
    let adds = self.itemsObs().filter(acct => acct.checkedObs());
    Promise.each(adds, (org) => fn(org))
      .then(params.closeFunc)
      .catch(utils.failureHandler({ id: "add_sponsored_study" }));
  };

  self.sponsoredStudiesIds = new Set();

  serverService.getSponsoredStudies(params.orgId, {offsetBy: 0, pageSize: 100})
    .then((response) => self.sponsoredStudiesIds = new Set(response.items.map(study => study.id)))
    .then(() => serverService.getStudies(0, 100))
    .then((response) => {
      response.items = response.items.filter(item => !self.sponsoredStudiesIds.has(item.id));
      return response;
    })
    .then(fn.handleObsUpdate(self.itemsObs, "items"))
    .catch(utils.failureHandler({ id: "add_sponsored_study" }));
}
