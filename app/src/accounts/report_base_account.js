import BaseAccount from "./base_account";
import Binder from "../binder";
import fn from "../functions";
import jsonFormatter from "../json_formatter";
import ko from "knockout";
import root from "../root";
import serverService from "../services/server_service";
import tables from "../tables";
import utils from "../utils";

export default class ReportBaseAccount extends BaseAccount {
  constructor(params) {
    super(params);

    // let's default these to something that isn't horrible
    let sd = new Date(new Date().setHours(new Date().getHours()-168)).toISOString().split("T")[0];
    let ed = new Date(new Date().toISOString()).toISOString().split("T")[0];

    this.binder.obs("name", "")
      .obs("identifier", this.identifier)
      .obs("startDate", sd)
      .obs("endDate", ed)
      .obs("status");
    
    tables.prepareTable(this, {
      name: "report",
      delete: (item) => this.deleteReport(item),
      id: this.failureParams.id,
      refresh: () => this.getReports()
    });

    this.doCalSearch = this.doCalSearch.bind(this);

    this.getAccount()
      .then(() => serverService.getParticipantReportIndex(params.identifier))
      .then((index) => this.studyIds = index.studyIds)
      .then(() => this.getReports())
      .catch(fn.seq(utils.failureHandler(this.failureParams), () => this.itemsObs([])));    
  }
  loadAccount() {
    throw new Error('loadAccount not implemented');
  }
  deleteReport(item) {
    throw new Error('deleteReport not implemented');
  }
  canEdit() {
    return root.isDeveloper() || root.isStudyCoordinator();
  }
  getReports() {
    let startDate = fn.formatDate(this.startDateObs(), 'iso');
    let endDate = fn.formatDate(this.endDateObs(), 'iso');
    return serverService.getParticipantReport(this.userId, this.identifier, startDate, endDate)
      .then(fn.handleMap("items", jsonFormatter.mapItem))
      .then(fn.handleSort("items", "date", true))
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
  }
  doCalSearch() {
    if (this.startDateObs() && this.endDateObs()) {
      utils.clearErrors();
      this.itemsObs([]);
      this.recordsMessageObs("<div class='ui tiny active inline loader'></div>");
      this.getReports();
    }
  }
  linkMaker() {
    throw new Error('linkMaker not implemented');
  }
  addReport(vm, event) {
    root.openDialog("report_editor", {
      add: true,
      closeDialog: this.closeDialog.bind(this),
      identifier: this.identifier,
      userId: this.userId,
      type: "participant",
      studyIds: this.studyIds
    });
  }
  closeDialog() {
    root.closeDialog();
    this.getReports();
  }
  toggle(model) {
    model.collapsedObs(!model.collapsedObs());
  }
  editReportRecord(item, event) {
    let self = ko.contextFor(event.target).$component;
    root.openDialog("report_editor", {
      add: false,
      closeDialog: self.closeDialog.bind(self),
      identifier: self.identifier,
      userId: self.userId,
      date: item.date,
      data: item.data,
      type: "participant",
      studyIds: self.studyIds
    });
  }
}