import Binder from "../../binder";
import fn from "../../functions";
import optionsService from "../../services/options_service";
import root from "../../root";
import serverService from "../../services/server_service";
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
  fn.copyProps(self, root, 'isAdmin');

  let binder = new Binder(self)
    .obs("title", "New Study")
    .obs("isNew", params.id === "new")
    .obs("createdOn")
    .obs("modifiedOn")
    .obs("orgOptions[]")
    .bind("version")
    .bind("name")
    .bind("orgId")
    .bind("identifier", params.id === "new" ? null : params.id);

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
    params.id = self.identifierObs();
    self.modifiedOnObs(response.modifiedOn);
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
          document.location = "#/studies/" + self.identifierObs();
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
    .then((opts) => self.orgOptionsObs.pushAll(opts))
    .catch(failureHandler);
};
