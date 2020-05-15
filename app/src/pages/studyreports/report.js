import Binder from "../../binder";
import fn from "../../functions";
import jsonFormatter from "../../json_formatter";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function firstDayOfMonth(year, month) {
  return fn.formatDate(new Date(year, month, 1), "iso");
}
function lastDayOfMonth(year, month) {
  return fn.formatDate(new Date(year, month + 1, 0), "iso");
}

export default function report(params) {
  let self = this;
  self.appId = null;

  new Binder(self)
    .obs("identifier", params.id)
    .obs("showLoader", false)
    .obs("public", false)
    .obs("toggle")
    .obs("formatMonth");

  fn.copyProps(self, root, "isDeveloper");

  function publicToggled(newValue) {
    utils.startHandler(self, event);
    serverService.updateStudyReportIndex({ identifier: params.id, public: newValue })
      .then(fn.handleStaticObsUpdate(self.publicObs, newValue))
      .then(fn.handleStaticObsUpdate(self.toggleObs, newValue))
      .then(utils.successHandler(self, event, "Report updated."))
      .catch(utils.failureHandler());
  }
  function loadIndex() {
    return serverService.getStudyReportIndex(params.id)
      .then(fn.handleObsUpdate(self.publicObs, "public"))
      .then(fn.handleObsUpdate(self.toggleObs, "public"))
      .then(() => self.toggleObs.subscribe(publicToggled, null, "change"));
  }
  loadIndex();

  let d = new Date();
  self.currentMonth = d.getMonth();
  self.currentYear = d.getFullYear();

  tables.prepareTable(self, {
    name: "report record",
    delete: (item) => serverService.deleteStudyReportRecord(params.id, item.date),
    id: "report"
  });

  self.addReport = function(vm, event) {
    root.openDialog("report_editor", {
      add: false,
      closeDialog: self.closeDialog,
      identifier: params.id,
      type: "study",
      substudyIds: self.substudyIds
    });
  };
  self.closeDialog = function() {
    root.closeDialog();
    load();
  };
  self.toggle = function(model) {
    model.collapsedObs(!model.collapsedObs());
  };
  self.editReportRecord = function(item) {
    root.openDialog("report_editor", {
      add: false,
      closeDialog: self.closeDialog,
      identifier: params.id,
      date: item.date,
      data: item.data,
      substudyIds: self.substudyIds
    });
    return false;
  };
  self.priorMonth = function() {
    if (self.currentMonth === 0) {
      self.currentYear--;
      self.currentMonth = 11;
    } else {
      self.currentMonth--;
    }
    load();
  };
  self.nextMonth = function() {
    if (self.currentMonth === 11) {
      self.currentYear++;
      self.currentMonth = 0;
    } else {
      self.currentMonth++;
    }
    load();
  };
  self.thisMonth = function() {
    let d = new Date();
    self.currentMonth = d.getMonth();
    self.currentYear = d.getFullYear();
    load();
  };

  function loadStudyReportRecords(index) {
    self.substudyIds = index.substudyIds;
    let startDate = firstDayOfMonth(self.currentYear, self.currentMonth);
    let endDate = lastDayOfMonth(self.currentYear, self.currentMonth);
    if (index.public) {
      return serverService.getPublicStudyReport(self.appId, params.id, startDate, endDate);
    } else {
      return serverService.getStudyReport(params.id, startDate, endDate);
    }
  }

  function load() {
    self.showLoaderObs(true);
    self.formatMonthObs(MONTHS[self.currentMonth] + " " + self.currentYear);
    serverService.getSession()
      .then((session) => self.appId = session.appId)
      .then(() => serverService.getStudyReportIndex(params.id))
      .then(loadStudyReportRecords)
      .then(fn.handleSort("items", "date", true))
      .then(fn.handleMap("items", jsonFormatter.mapItem))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(fn.handleStaticObsUpdate(self.showLoaderObs, false))
      .catch(utils.failureHandler());
  }
  load();
};
