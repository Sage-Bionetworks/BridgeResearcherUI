import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function reports() {
  let self = this;

  self.isDeveloper = root.isDeveloper;
  self.studyIds = [];

  tables.prepareTable(self, {
    name: "report",
    delete: (item) => serverService.deleteStudyReport(item.identifier),
    id: 'reports',
    refresh: load
  });
  self.addReport = function(vm, event) {
    root.openDialog("report_editor", {
      add: true,
      closeDialog: self.closeDialog,
      type: "study"
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

  function processStudyReport(item) {
    item.publicObs = ko.observable(item.public);
    item.toggleObs = ko.observable(item.public);
    item.toggleObs.subscribe(function(newValue) {
      item.public = newValue;
      serverService.updateStudyReportIndex(item).then(function() {
        item.toggleObs(newValue);
        item.publicObs(newValue);
      });
    });
  }
  function load() {
    serverService.getSession()
      .then((session) => self.studyIds = session.studyIds)
      .then(() => serverService.getStudyReports())
      .then(fn.handleForEach("items", processStudyReport))
      .then(fn.handleSort("items", "identifier"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({ id: 'reports' }));
  }
  load();
};
