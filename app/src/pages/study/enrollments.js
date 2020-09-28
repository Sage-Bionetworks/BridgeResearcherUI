import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function(params) {
  let self = this;

  self.query = {pageSize: 10};
  self.postLoadPagerFunc = fn.identity;
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;
  fn.copyProps(self, root, "isAdmin", "isResearcher");
  fn.copyProps(self, fn, "formatDateTime", "formatNameAsFullLabel");

  new Binder(self)
    .obs("title", "New Study")
    .obs("isNew", false)
    .bind("identifier", params.id);

  self.enrollDialog = function() {
    root.openDialog("add_enrollment", {
      closeFunc: fn.seq(root.closeDialog, () => {
        self.query.offsetBy = 0;
        loadEnrollments(self.query)
      }),
      studyId: params.id
    });
  };
  self.unenroll = (item, event) => {
    alerts.prompt("Why are you withdrawing this person?", (withdrawalNote) => {
      utils.startHandler(self, event);
      serverService.unenroll(params.id, item.participant.identifier, withdrawalNote)
        .then(() => loadEnrollments(self.query))
        .then(utils.successHandler(self, event, "Participant removed from study."))
        .catch(utils.failureHandler({ id: 'enrollments' }));
    });
  };

  tables.prepareTable(self, {
    name: "enrollee",
    type: "Enrollee",
    id: "enrollments",
    refresh: () => loadEnrollments(self.query)
  });

  serverService.getStudy(params.id)
    .then(fn.handleObsUpdate(self.titleObs, "name"));

  function loadEnrollments(query) {
    // some state is not in the pager, update that and capture last known state of paging
    self.query = query;

    serverService.getEnrollments(params.id, query)
      .then(self.postLoadPagerFunc)
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({ id: 'enrollments' }));
  }
  ko.postbox.subscribe('en-refresh', loadEnrollments);
};
