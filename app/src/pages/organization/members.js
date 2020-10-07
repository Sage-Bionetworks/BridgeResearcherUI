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

export default function(params) {
  let self = this;

  fn.copyProps(self, root, "isAdmin");
  
  self.isUserNavigable = function() {
    return root.isAdmin() || root.isResearcher();
  }

  let binder = new Binder(self)
    .obs("isNew", false)
    .obs("title")
    .obs("identifier");

  serverService.getOrganization(params.id)
    .then(binder.update())
    .then(fn.handleObsUpdate(self.titleObs, "name"))
    .catch(failureHandler);

  self.query = {pageSize: 100};
  self.postLoadPagerFunc = fn.identity;
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
      .catch(utils.failureHandler({ id: 'org_members' }));
  };

  tables.prepareTable(self, {
    name: "organization member",
    type: "Organization Members",
    id: "org_members",
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
      .catch(utils.failureHandler({ id: 'org_members' }));
  }
  ko.postbox.subscribe('members-refresh', loadMembers);
};
