import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import root from '../../root';
import serverService from "../../services/server_service";
import tables from '../../tables';
import utils from "../../utils";

let failureHandler = utils.failureHandler({
  redirectMsg: "Organization not found.",
  redirectTo: "organizations",
  transient: false,
  id: 'org'
});

export default function(params) {
  let self = this;

  fn.copyProps(self, root, 'isAdmin');

  let binder = new Binder(self)
    .obs("isNew", false)
    .obs("title")
    .obs("identifier");

  serverService.getOrganization(params.id)
    .then(binder.update())
    .then(fn.handleObsUpdate(self.titleObs, "name"))
    .catch(failureHandler);

  self.query = {pageSize: 100};
  self.postLoadPagerFunc = () => {};
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;

  self.removeSponsored = (item, event) => {
    alerts.deleteConfirmation("This changes permission (and can be undone), but are you sure?", () => {
      utils.startHandler(self, event);
      serverService.removeSponsored(params.id, item.id)
        .then(() => loadSponsored(self.query))
        .then(utils.successHandler(self, event, "Study no longer sponsored."))
        .catch(utils.failureHandler({ id: 'org_sponsored' }));
    });
  };

  tables.prepareTable(self, {
    name: "sponsored study",
    type: "Sponsored Studies",
    id: "org_sponsored",
    refresh: () => loadSponsored(self.query)
  });

  function loadSponsored(query) {
    if (self.isNewObs()) {
      return Promise.resolve({});
    }
    // some state is not in the pager, update that and capture last known state of paging
    self.query = query;

    serverService.getSponsoredStudies(params.id, query)
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'org_sponsored' }));
  }
  loadSponsored(self.query);
};
