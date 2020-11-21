import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

const notFound = utils.failureHandler({
  redirectTo: "organizations",
  redirectMsg: "Organization not found.",
  id: "orgs"
});

export default function organizations() {
  let self = this;
  self.query = {}; // capture this for when the *parent* wants to refresh the page

  // capture post-processing of the pager control
  self.postLoadPagerFunc = fn.identity;
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;

  fn.copyProps(self, root, "isAdmin");

  tables.prepareTable(self, {
    name: "organization",
    type: "Organization",
    id: "orgs",
    refresh: () => load(self.query),
    delete: org => serverService.deleteOrganization(org.identifier)
  });

  self.orgMembership = null;

  self.canEdit = function(item) {
    return self.orgMembership === item.identifier;
  }

  function load(query) {
    // some state is not in the pager, update that and capture last known state of paging
    self.query = query;
    serverService.getSession()
      .then((session) => self.orgMembership = session.orgMembership)
      .then(() => serverService.getOrganizations(query.offsetBy, query.pageSize))
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(notFound);
  }
  ko.postbox.subscribe('org-refresh', load);
};
