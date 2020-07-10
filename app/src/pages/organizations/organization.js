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

export default function organization(params) {
  let self = this;
  self.organization = {};

  fn.copyProps(self, fn, 'formatDateTime', 'formatTitleCase');
  fn.copyProps(self, root, 'isAdmin');

  self.isUserNavigable = function() {
    return root.isAdmin() || root.isResearcher();
  }

  let binder = new Binder(self)
    .obs("isNew", params.id === "new")
    .obs("title", "New Organization")
    .bind("name")
    .bind("identifier")
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
        document.location = "#/organizations/" + response.identifier;
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
      return serverService.getOrganization(params.id)
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


  // Member functionality
  // capture post-processing of the pager control
  self.query = {pageSize: 100};
  self.postLoadPagerFunc = () => {};
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;
  fn.copyProps(self, fn, "formatIdentifiers", "formatNameAsFullLabel");

  self.addMemberDialog = function() {
    root.openDialog("add_org_member", {
      closeFunc: fn.seq(root.closeDialog, () => {
        self.query.offsetBy = 0;
        loadMembers(self.query)
      }),
      orgId: params.id
    });
  };
  self.removeOrgMember = (item, event) => {
    utils.startHandler(self, event);
    serverService.removeOrgMember(params.id, item.id)
      .then(() => loadMembers(self.query))
      .then(utils.successHandler(self, event, "Member removed."))
      .catch(utils.failureHandler({ id: 'members' }));
  };

  tables.prepareTable(self, {
    name: "organization member",
    type: "Organization Members",
    id: "members",
    refresh: () => loadMembers(self.query)
  });

  let mapItems = (response) => {
    response.items.forEach((acct) => fn.formatNameAsFullLabel(acct));
    return response;
  }

  function loadMembers(query) {
    if (self.isNewObs()) {
      return Promise.resolve({});
    }
    // some state is not in the pager, update that and capture last known state of paging
    self.query = query;

    serverService.getOrganizationMembers(params.id, query)
      .then(mapItems)
      .then(fn.handleSort("items", "fullName"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'members' }));
  }
  loadMembers(self.query);
};
