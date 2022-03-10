import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from '../../root';
import serverService from "../../services/server_service";
import utils from "../../utils";

let failureHandler = utils.failureHandler({
  redirectMsg: "Organization not found.",
  redirectTo: "organizations",
  transient: false,
  id: 'org'
});

export default class OrganizationEditor {
  constructor(params) {
    this.organization = {};
    this.orgId = params.orgId;
    fn.copyProps(this, fn, 'formatDateTime', 'formatTitleCase');
    fn.copyProps(this, root, 'isAdmin', 'isOrgAdmin');

    this.binder = new Binder(this)
      .obs("isNew", this.orgId === "new")
      .obs("title", "New Organization")
      .bind("name")
      .bind("identifier", this.orgId === "new" ? null : this.orgId)
      .bind("description")
      .bind("createdOn")
      .bind("modifiedOn")
      .bind("version");

    this.updateModifiedOn = this.updateModifiedOn.bind(this);

    if (!this.isNewObs()) {
      this.load();
    }
  }
  canEdit() {
    return root.isAdmin() || root.isOrgAdmin();
  }
  isUserNavigable() {
    return root.isAdmin() || root.isResearcher();
  }
  updateModifiedOn(response) { 
    this.modifiedOnObs(new Date().toISOString());
    this.titleObs(this.nameObs());
    return response;
  }
  saveOrg(org) {
    if (this.isNewObs()) {
      return serverService.createOrganization(org).then(response => {
        document.location = `/organizations/${response.identifier}`;
        return response;
      });
    }
    return serverService.updateOrganization(org.identifier, org)
      .then(this.updateModifiedOn)
      .then(fn.handleObsUpdate(this.versionObs, "version"))
      .then(fn.handleStaticObsUpdate(this.isNewObs, false));
  }
  load() {
    if (this.isNewObs()) {
      return Promise.resolve({version:0})
        .then(this.binder.assign("organization"))
        .then(this.binder.update());
    } else {
      return serverService.getOrganization(this.orgId)
        .then(this.binder.assign("organization"))
        .then(this.binder.update())
        .then(fn.handleObsUpdate(this.titleObs, "name"))
        .catch(failureHandler);
    }
  }
  save(vm, event) {
    this.organization = this.binder.persist(this.organization);

    utils.startHandler(vm, event);
    this.saveOrg(this.organization)
      .then(utils.successHandler(vm, event, "Organization has been saved."))
      .catch(failureHandler);
  }
}
