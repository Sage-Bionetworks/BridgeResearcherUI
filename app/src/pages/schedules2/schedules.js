import fn from "../../functions";
import ko from "knockout";
import optionsService from "../../services/options_service";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default class Schedules {
  constructor(params) {
    this.query = {};
    this.orgNames = {};
    this.tagsObs = ko.observable('');
    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;

    fn.copyProps(this, root, "isAdmin");
    fn.copyProps(this, fn, "formatDateTime");

    tables.prepareTable(this, {
      name: "schedule",
      refresh: () => this.load(this.query),
      id: "schedules",
      delete: (item) => serverService.deleteSchedule(item.guid, false),
      deletePermanently: (item) => serverService.deleteSchedule(item.guid, true),
      undelete: (item) => serverService.updateSchedule(item)
    });
    ko.postbox.subscribe('schedules-refresh', (arg) => this.load(arg));
  }
  formatOrg(orgId) {
    return this.orgNames[orgId] ? this.orgNames[orgId] : orgId;
  }
  load(query) {
    query.tags = this.tagsObs();
    this.query = query;

    return optionsService.getOrganizationNames()
      .then(response => this.orgNames = response)
      .then(() => serverService.getSchedules(query, this.showDeletedObs()))
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .then(this.postLoadPagerFunc.bind(this))
      .catch(utils.failureHandler({ id: 'schedules' }));
  }
}
