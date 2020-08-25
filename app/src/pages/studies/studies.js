import fn from "../../functions";
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
    refresh: load,
    delete: (item) => serverService.deleteStudy(item.identifer, false),
    deletePermanently: (item) => serverService.deleteStudy(item.identifier, true),
    undelete: (item) => serverService.updateStudy(item)
  });

  self.session = null;

  self.canAccess = function(studyId) {
    return self.session.roles.indexOf('admin') > -1 || self.session.studyIds.includes(studyId);
  }

  function load() {
    return serverService.getSession()
      .then((session) => self.session = session)
      .then(() => serverService.getStudies(self.showDeletedObs()))
      .then(fn.handleSort("items", "label"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({id: 'studies'}));
  }
  load();
};
