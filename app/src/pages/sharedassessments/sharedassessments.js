import fn from "../../functions";
import ko from "knockout";
import optionsService from "../../services/options_service";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function() {
  let self = this;
  self.query = {};
  fn.copyProps(self, root, "isAdmin");
  self.reload = () => load(self.query);

  self.tagsObs = ko.observable('');

  tables.prepareTable(self, {
    name: "assessment",
    refresh: self.reload,
    id: "assessments",
    delete: (item) => serverService.deleteSharedAssessment(item.guid, false),
    deletePermanently: (item) => serverService.deleteSharedAssessment(item.guid, true),
    undelete: (item) => serverService.updateSharedAssessment(item)
  });

  // some nonsense related to the pager that I copy now by rote
  self.postLoadPagerFunc = fn.identity;
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;

  self.orgNames = {};

  self.formatOrg = function(orgId) {
    if (orgId) {
      let [appIdPart, orgIdPart] = orgId.split(':');
      let orgName = self.orgNames[orgIdPart] ? self.orgNames[orgIdPart] : orgIdPart;
      return orgName;
    }
    return '';
  }

  function load(query) {
    query.tag = self.tagsObs();
    self.query = query;

    optionsService.getOrganizationNames()
      .then((response) => self.orgNames = response)
      .then(() => serverService.getSharedAssessments(query, self.showDeletedObs()))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'assessments' }));
  }
  ko.postbox.subscribe('asm-refresh', load);
};
