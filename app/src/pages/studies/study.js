import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import optionsService from "../../services/options_service";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "Study not found.",
  redirectTo: "studies",
  transient: false,
  id: 'study'
});

export default function(params) {
  let self = this;
  self.study = {};

  fn.copyProps(self, fn, "formatDateTime");
  fn.copyProps(self, root, 'isSuperadmin', 'isAdmin');

  let binder = new Binder(self)
    .obs("title", "New Study")
    .obs("isNew", params.id === "new")
    .obs("createdOn")
    .obs("modifiedOn")
    .obs("orgOptions[]")
    .bind("version")
    .bind("name")
    .bind("orgId")
    .bind("id", params.id === "new" ? null : params.id);

  function load() {
    return params.id === "new" ? 
      Promise.resolve({}) : 
      serverService.getStudy(params.id).then(fn.handleObsUpdate(self.titleObs, "name"));
  }
  function saveStudy() {
    return params.id === "new" ? 
      serverService.createStudy(self.study) : 
      serverService.updateStudy(self.study);
  }
  function updateModifiedOn(response) {
    params.id = self.idObs();
    return response;
  }

  self.formatOrgId = function(orgId) {
    const orgs = self.orgOptionsObs();
    if (orgId && orgs.some(opt => opt.value === orgId)) {
      return orgs.filter(opt => opt.value === orgId)[0].label;
    }
    return orgId;
  }
  self.save = function(vm, event) {
    self.study = binder.persist(self.study);

    utils.startHandler(vm, event);
    saveStudy()
      .then(response => {
        if (params.id === "new") {
          document.location = "#/studies/" + self.idObs();
        }
        return response;
      })
      .then(fn.handleStaticObsUpdate(self.isNewObs, false))
      .then(fn.handleObsUpdate(self.versionObs, "version"))
      .then(fn.handleStaticObsUpdate(self.modifiedOnObs, new Date()))
      .then(updateModifiedOn)
      .then(fn.returning(self.study))
      .then(fn.handleObsUpdate(self.titleObs, "name"))
      .then(utils.successHandler(vm, event, "Study has been saved."))
      .catch(failureHandler);
  };

  load().then(binder.assign("study"))
    .then(binder.update())
    .then(optionsService.getOrganizationOptions)
    .then((opts) => self.orgOptionsObs.pushAll(opts));

  /* SPONSORS */
  self.query = {pageSize: 100};
  self.postLoadPagerFunc = () => {};
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;
  fn.copyProps(self, fn, "formatIdentifiers", "formatNameAsFullLabel");

  self.addSponsorDialog = function() {
    root.openDialog("add_sponsor", {
      closeFunc: fn.seq(root.closeDialog, () => {
        self.query.offsetBy = 0;
        loadSponsors(self.query)
      }),
      studyId: params.id
    });
  };
  self.removeSponsor = (item, event) => {
    alerts.deleteConfirmation("This changes permission (and can be undone), but are you sure?", () => {
      utils.startHandler(self, event);
      serverService.removeSponsor(params.id, item.identifier)
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

  function loadSponsors(query) {
    if (self.isNewObs()) {
      return Promise.resolve({});
    }
    // some state is not in the pager, update that and capture last known state of paging
    self.query = query;

    serverService.getSponsors(params.id, query)
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'sponsors' }));
  }
  loadSponsors(self.query);

};
