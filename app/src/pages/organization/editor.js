import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
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

export default function organization(params) {
  let self = this;
  self.organization = {};

  fn.copyProps(self, fn, 'formatDateTime', 'formatTitleCase');
  fn.copyProps(self, root, 'isAdmin', 'isOrgAdmin');

  self.canEdit = function() {
    return root.isAdmin() || root.isOrgAdmin();
  }

  self.isUserNavigable = function() {
    return root.isAdmin() || root.isResearcher();
  }

  let binder = new Binder(self)
    .obs("isNew", params.orgId === "new")
    .obs("title", "New Organization")
    .bind("name")
    .bind("identifier", params.orgId === "new" ? null : params.orgId)
    .bind("description")
    .bind("createdOn")
    .bind("modifiedOn")
    .bind("version");

  function updateModifiedOn(response) { 
    self.modifiedOnObs(new Date().toISOString());
    self.titleObs(self.nameObs());
    return response;
  }
  function saveOrg(org) {
    if (self.isNewObs()) {
      return serverService.createOrganization(org).then(response => {
        document.location = `/organizations/${response.identifier}`;
        return response;
      });
    }
    return serverService.updateOrganization(org.identifier, org)
      .then(updateModifiedOn)
      .then(fn.handleObsUpdate(self.versionObs, "version"))
      .then(fn.handleStaticObsUpdate(self.isNewObs, false));
  }
  function load() {
    if (self.isNewObs()) {
      return Promise.resolve({version:0})
        .then(binder.assign("organization"))
        .then(binder.update());
    } else {
      return serverService.getOrganization(params.orgId)
        .then(binder.assign("organization"))
        .then(binder.update())
        .then(fn.handleObsUpdate(self.titleObs, "name"))
        .catch(failureHandler);
    }
  }

  self.save = function(vm, event) {
    self.organization = binder.persist(self.organization);

    utils.startHandler(vm, event);
    saveOrg(self.organization)
      .then(utils.successHandler(vm, event, "Organization has been saved."))
      .catch(failureHandler);
  };
  if (!self.isNewObs()) {
    load();
  }
};
