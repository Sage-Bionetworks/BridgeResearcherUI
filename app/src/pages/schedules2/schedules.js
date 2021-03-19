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
  fn.copyProps(self, fn, "formatDateTime");
  self.reload = () => load(self.query);

  self.tagsObs = ko.observable('');

  tables.prepareTable(self, {
    name: "schedule",
    refresh: self.reload,
    id: "schedules",
    delete: (item) => serverService.deleteSchedule(item.guid, false),
    deletePermanently: (item) => serverService.deleteSchedule(item.guid, true),
    undelete: (item) => serverService.updateSchedule(item)
  });

  // some nonsense related to the pager that I copy now by rote
  self.postLoadPagerFunc = fn.identity;
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;

  self.orgNames = {};

  self.formatOrg = function(orgId) {
    return self.orgNames[orgId] ? self.orgNames[orgId] : orgId;
  }

  function load(query) {
    query.tags = self.tagsObs();
    self.query = query;

    optionsService.getOrganizationNames()
      .then((response) => self.orgNames = response)
      .then(() => serverService.getSchedules(query, self.showDeletedObs()))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'schedules' }));
  }
  ko.postbox.subscribe('schedules-refresh', load);
};
