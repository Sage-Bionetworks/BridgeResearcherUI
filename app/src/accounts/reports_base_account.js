import BaseAccount from "./base_account";
import Binder from "../binder";
import fn from "../functions";
import root from "../root";
import serverService from "../services/server_service";
import tables from "../tables";
import utils from "../utils";

export default class ReportsBaseAccount extends BaseAccount {
  constructor(params) {
    super(params);

    this.studyIds = [];
    
    this.binder.obs("name", "");

    tables.prepareTable(this, {
      name: "report",
      delete: (item) => this.deleteReport(item),
      id: this.failureParams.id,
      refresh: () => this.getReports()
    });

    serverService.getSession()
      .then(session => this.studyIds = session.studyIds)
      .then(() => this.getAccount())
      .then(() => this.getReports());

  }
  loadAccount() {
    throw new Error('loadAccount not implemented');
  }
  deleteReport() {
    throw new Error('deleteReport not implemented');
  }
  reportURL(item) {
    throw new Error('reportURL not implemented');
  }
  loadReports() { 
    throw new Error('loadReports not implemented');
  }
  getReports() {
    return this.loadReports()
      .then(fn.handleSort("items", "identifier"))
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .catch(utils.failureHandler(this.failureParams));
  }
  addReport() {
    root.openDialog("report_editor", {
      add: true,
      closeDialog: this.closeDialog.bind(this),
      userId: this.userId,
      studyId: this.studyId,
      type: "participant"
    });
  }
  closeDialog(vm, event) {
    root.closeDialog();
    this.getReports();
  }
  isVisible(item) {
    item.studyIds = item.studyIds || [];
    return item.public || 
      this.studyIds.length === 0 || 
      this.studyIds.some((el) => item.studyIds.includes(el));
  }
}