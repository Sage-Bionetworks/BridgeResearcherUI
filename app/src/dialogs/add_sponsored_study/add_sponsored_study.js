import fn from '../../functions';
import ko from 'knockout';
import Promise from "bluebird";
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

const PAGE_KEY = 'asp-refresh';

export default function(params) {
  const self = this;

  self.closeDialog = params.closeFunc;
  self.sponsoredStudiesIds = new Set();

  self.query = {};

  tables.prepareTable(self, {
    name: "study",
    id: "add_sponsored_study",
    refresh: () => ko.postbox.publish(PAGE_KEY)
  });

  self.addAndClose = (vm, event) => {
    utils.startHandler(vm, event);

    let fn = (study) => serverService.addSponsor(study.identifier, params.orgId);
    let adds = self.itemsObs().filter(item => 
      item.checkedObs() && !self.sponsoredStudiesIds.has(item.identifier));
    Promise.each(adds, (org) => fn(org))
      .then(params.closeFunc)
      .catch(utils.failureHandler({ id: "add_sponsored_study" }));
  };
  self.isPermanentlyChecked = function(item) {
    return self.sponsoredStudiesIds.has(item.identifier);
  }

  self.load = function(offsetBy) {
    self.query.offsetBy = offsetBy;
    return serverService.getSponsoredStudies(params.orgId, {offsetBy: 0, pageSize: 100})
      .then((response) => self.sponsoredStudiesIds = new Set(response.items.map(study => study.identifier)))
      .then(() => serverService.getStudies(self.query))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then((response) => {
        response.items.forEach(item => {
          item.checkedObs(self.sponsoredStudiesIds.has(item.identifier));
        });
        return response;
      })
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({ id: "add_sponsored_study" }));
  }
  setTimeout(() => ko.postbox.publish(PAGE_KEY), 1);
}
