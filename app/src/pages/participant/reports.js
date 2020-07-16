import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

const failureHandler = utils.failureHandler({
  redirectTo: "participants",
  redirectMsg: "Participant not found",
  id: 'participant-reports'
});

export default function reports(params) {
  let self = this;
  self.studyIds = [];
  fn.copyProps(self, root, "isResearcher");
  
  new Binder(self)
    .obs("userId", params.userId)
    .obs("name", "")
    .obs("status")
    .obs("title", "&#160;");

  fn.copyProps(self, root, "isDeveloper", "isResearcher");

  serverService.getParticipantName(params.userId)
    .then(function(part) {
      self.titleObs(part.name);
      self.nameObs(part.name);
      self.statusObs(part.status);
    })
    .catch(failureHandler);

  tables.prepareTable(self, {
    name: "report",
    delete: (item) => serverService.deleteParticipantReport(item.identifier, params.userId),
    id: 'participant-reports',
    refresh: load
  });

  self.reportURL = (item) => "#/participants/" + self.userIdObs() + "/reports/" + item.identifier;

  self.addReport = function(vm, event) {
    root.openDialog("report_editor", {
      add: true,
      closeDialog: self.closeDialog,
      userId: params.userId,
      type: "participant"
    });
  };
  self.closeDialog = function() {
    root.closeDialog();
    load();
  };
  self.isVisible = function(item) {
    item.studyIds = item.studyIds || [];
    return item.public || 
      self.studyIds.length === 0 || 
      self.studyIds.some((el) => item.studyIds.includes(el));
  };
  
  function load() {
    serverService.getSession()
      .then((session) => self.studyIds = session.studyIds)
      .then(() => serverService.getParticipant(params.userId))
      .then(serverService.getParticipantReports.bind(serverService))
      .then(fn.handleSort("items", "identifier"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(failureHandler);
  }
  load();
};
