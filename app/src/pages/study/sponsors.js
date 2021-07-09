import alerts from "../../widgets/alerts";
import config from "../../config";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";
import BaseStudy from "./base_study";

export default class StudySponsors extends BaseStudy {
  constructor(params) {
    super(params, 'sponsors');
    fn.copyProps(this, root, "isAdmin");

    this.query = {pageSize: 100};
    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;

    tables.prepareTable(this, {
      name: "sponsor",
      type: "Sponsor",
      id: "sponsors",
      refresh: () => this.loadSponsors(this.query)
    });
    ko.postbox.subscribe('sp-refresh', this.loadSponsors.bind(this));

    super.load();
  }
  addSponsorDialog() {
    root.openDialog("add_sponsor", {
      closeFunc: fn.seq(root.closeDialog, () => {
        this.query.offsetBy = 0;
        this.loadSponsors(this.query)
      }),
      studyId: this.studyId
    });
  }
  removeSponsor(item, event) {
    alerts.deleteConfirmation(config.msgs.UNDO_SPONSOR, () => {
      utils.startHandler(this, event);
      serverService.removeSponsor(this.studyId, item.identifier)
        .then(() => this.loadSponsors(this.query))
        .then(utils.successHandler(this, event, "Sponsor removed."))
        .catch(this.failureHandler);
    });
  }
  loadSponsors(query) {
    if (this.isNewObs()) {
      return Promise.resolve({});
    }
    // some state is not in the pager, update that and capture last known state of paging
    this.query = query;

    serverService.getSponsors(this.studyId, query)
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .then(this.postLoadPagerFunc)
      .catch(this.failureHandler);
  }
}
