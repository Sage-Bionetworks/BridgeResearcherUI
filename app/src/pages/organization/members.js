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
  id: 'org_members'
});

const cssClassNameForStatus = {
  disabled: "negative",
  unverified: "warning",
  verified: ""
};

function assignClassForStatus(participant) {
  // does not have sharing scope so we can't show it on summary page.
  return cssClassNameForStatus[participant.status];
}

export default function(params) {
  let self = this;

  self.classNameForStatus = assignClassForStatus;
  
  self.isUserNavigable = function() {
    return root.isAdmin() || root.isOrgAdmin();
  }
  self.canAddRemove = function() {
    return root.isOrgAdmin() || root.isAdmin();
  }

  let binder = new Binder(self)
    .obs("isNew", false)
    .obs("title")
    .obs("identifier", params.orgId);

  serverService.getOrganization(params.orgId)
    .then(binder.update())
    .then(fn.handleObsUpdate(self.titleObs, "name"))
    .catch(failureHandler);

  self.query = {pageSize: 100};
  self.postLoadPagerFunc = fn.identity;
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;
  fn.copyProps(self, fn, "formatParticipantLabel");

  function formatOneRole(role) {
    return role.split('_').map(s => s.substring(0,1).toUpperCase() + s.substring(1)).join(' ');
  }

  self.formatRoles = function(roles) {
    return roles.map(formatOneRole).join(', ');
  }

  self.addMemberDialog = function() {
    root.openDialog("add_org_member", {
      closeFunc: fn.seq(root.closeDialog, () => {
        self.query.offsetBy = 0;
        loadMembers(self.query)
      }),
      orgId: params.orgId
    });
  };
  self.removeOrgMember = (item, event) => {
    utils.startHandler(self, event);
    serverService.removeOrgMember(params.orgId, item.id)
      .then(() => loadMembers(self.query))
      .then(utils.successHandler(self, event, "Member removed."))
      .catch(utils.failureHandler({ id: 'org_members' }));
  };

  tables.prepareTable(self, {
    name: "organization member",
    type: "Organization Members",
    id: "org_members",
    delete: (item) => serverService.deleteAccount(item.id),
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

    serverService.getOrgMembers(params.orgId, query)
      .then(mapItems)
      .then(fn.handleSort("items", "fullName"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'org_members' }));
  }
  ko.postbox.subscribe('members-refresh', loadMembers);
};
