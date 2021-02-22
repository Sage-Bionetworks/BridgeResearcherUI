import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import config from "../../config";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function(params) {
  let self = this;

  self.query = {pageSize: 100};
  self.postLoadPagerFunc = fn.identity;
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;
  fn.copyProps(self, root, "isAdmin");

  new Binder(self)
    .obs("title", "New Study")
    .obs("isNew", false)
    .bind("identifier", params.studyId);

  self.addSponsorDialog = function() {a
    root.openDialog("add_sponsor", {
      closeFunc: fn.seq(root.closeDialog, () => {
        self.query.offsetBy = 0;
        loadSponsors(self.query)
      }),
      studyId: params.studyId
    });
  };
  self.removeSponsor = (item, event) => {
    alerts.deleteConfirmation(config.msgs.UNDO_SPONSOR, () => {
      utils.startHandler(self, event);
      serverService.removeSponsor(params.studyId, item.identifier)
        .then(() => loadSponsors(self.query))
        .then(utils.successHandler(self, event, "Sponsor removed."))
        .catch(utils.failureHandler({ id: 'sponsors' }));
    });
  };

  tables.prepareTable(self, {
    name: "sponsor",
    type: "Sponsor",
    id: "sponsors",
    refresh: () => loadSponsors(self.query)
  });

  serverService.getStudy(params.studyId)
    .then(fn.handleObsUpdate(self.titleObs, "name"));

  function loadSponsors(query) {
    if (self.isNewObs()) {
      return Promise.resolve({});
    }
    // some state is not in the pager, update that and capture last known state of paging
    self.query = query;

    serverService.getSponsors(params.studyId, query)
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'sponsors' }));
  }
  ko.postbox.subscribe('sp-refresh', loadSponsors);
};
