import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function() {
  let self = this;

  fn.copyProps(self, root, "isAdmin");

  tables.prepareTable(self, {
    name: "study",
    plural: "studies",
    id: "studies",
    refresh: () => load(self.query),
    delete: (item) => serverService.deleteStudy(item.identifier, false),
    deletePermanently: (item) => serverService.deleteStudy(item.identifier, true),
    undelete: (item) => serverService.updateStudy(item)
  });

  self.query = {};
  self.postLoadPagerFunc = (a) => fn.identity;
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;

  self.session = null;

  self.checkAdminOrSponsor = function(studyId) {
    return root.isAdmin()  || self.session.orgStudies.includes(studyId);
  }

  function load(query) {
    query.includeDeleted = self.showDeletedObs();
    self.query = query;
    serverService.getSession()
      .then((session) => self.session = session)
      .then(() => serverService.getSponsoredStudies(self.session.orgMembership))
      .then((response) => self.session.orgStudies = response.items.map(el => el.identifier))
      .then(() => serverService.getStudies(query))
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({id: 'studies'}));
  }
  ko.postbox.subscribe('studies-refresh', load);
};
