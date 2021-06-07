import Binder from "../../binder";
import fn from "../../functions";
import jsonFormatter from "../../json_formatter";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

const failureHandler = utils.failureHandler({
  redirectTo: "participants",
  redirectMsg: "Participant not found",
  id: 'participant-activity'
});

export default function activity(params) {
  let self = this;

  self.vm = self;
  self.callback = fn.identity;
  fn.copyProps(self, root, "isResearcher");

  self.formatTitleCase = fn.formatTitleCase;
  self.formatDateTime = fn.formatDateTime;

  self.formatActivityClass = function(item) {
    return item.activity.activityType === "survey" ? "tasks icon" : "child icon";
  };
  self.formatActivity = function(item) {
    let act = item.activity;
    let string = act.label;
    if (act.detail) {
      string += " (" + act.detail + ") ";
    }
    return string;
  };

  let { start, end } = fn.getRangeInDays(-14, 14);

  new Binder(self)
    .obs("userId", params.userId)
    .obs("title", "&#160;")
    .obs("guid", params.guid)
    .obs("startDate", start)
    .obs("endDate", end)
    .obs("status")
    .obs("searchLoading", false)
    .obs("activityLabel", "&#160;");

  serverService.getParticipantName(params.userId)
    .then(function(part) {
      self.titleObs(part.name);
      self.statusObs(part.status);
    }).catch(failureHandler);

  tables.prepareTable(self, {
    name: "activitie",
    type: "Activity",
    id: 'participant-activity'
  });

  self.toggle = (model) => model.collapsedObs(!model.collapsedObs());
  self.editReportRecord = function(item, event) {
    root.openDialog("json_editor", {
      saveFunc: self.saveFunc,
      closeFunc: root.closeDialog,
      item: item,
      data: item.data
    });
    return false;
  };
  self.saveFunc = function(item, data) {
    item.clientData = data;
    root.closeDialog();
  };
  self.doCalSearch = function() {
    self.searchLoadingObs(true);
    self.callback();
  };
  self.formatDateTimeRange = function(date1, date2) {
    var array = [];
    array.push(date1 ? fn.formatDateTime(date1) : "");
    array.push(date2 ? fn.formatDateTime(date2) : "");
    return array.join("&mdash;");
  };

  if (params.referentType === "surveys") {
    serverService.getSurveyMostRecent(params.guid)
      .then((response) => self.activityLabelObs(response.name));
  } else {
    self.activityLabelObs(params.guid);
  }

  // so that function is hoisted to the tables.prepareTable() call above
  function loadingFunc(args) {
    self.searchLoadingObs(false);
    if (!self.startDateObs() || !self.endDateObs()) {
      return Promise.resolve();
    }
    args = args || {};
    args.scheduledOnStart = fn.formatDateTime(self.startDateObs(), "iso");

    let date = new Date(self.endDateObs());
    date.setDate(date.getDate() + 1);
    args.scheduledOnEnd = fn.formatDateTime(date, "iso");

    return serverService
      .getParticipantNewActivities(self.userIdObs(), params.referentType, params.guid, args)
      .then(function(response) {
        response.items = response.items.map(jsonFormatter.mapClientDataItem);
        self.itemsObs(response.items);
        return response;
      });
  }
  self.loadingFunc = loadingFunc;
};
