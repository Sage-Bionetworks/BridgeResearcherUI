import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import config from "../../config";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function(params) {
  let self = this;

  self.query = {pageSize: 100};
  self.postLoadPagerFunc = () => {};
  self.postLoadFunc = (func) => self.postLoadPagerFunc = func;
  fn.copyProps(self, root, "isAdmin", "isResearcher");
  fn.copyProps(self, fn, "formatDateTime");

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
      serverService.unenroll(params.id, item.userId, withdrawalNote)
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

  function fmt(enrollee, fieldName) {
    return function(participant) {
      enrollee[fieldName] = fn.formatNameAsFullLabel(participant);
    }
  }

  serverService.getStudy(params.id)
    .then(fn.handleObsUpdate(self.titleObs, "name"));

  function loadEnrollments(query) {
    // some state is not in the pager, update that and capture last known state of paging
    self.query = query;

    serverService.getEnrollments(params.id, query).then(response => {
        let array = [];
        response.items.forEach(enrollee => {
          array.push(serverService.getParticipant(enrollee.userId)
            .then(fmt(enrollee, 'userIdLabel')));
            delete enrollee.enrolledBy;
          if (enrollee.enrolledBy) {
            array.push(serverService.getParticipant(enrollee.enrolledBy)
              .then(fmt(enrollee, 'enrolledByLabel')));
          }
          if (enrollee.withdrawnBy) {
            array.push(serverService.getParticipant(enrollee.withdrawnBy)
              .then(fmt(enrollee, 'withdrawnByLabel')));
          }
        });
        return Promise.all(array).then(() => response);
      })
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .then(self.postLoadPagerFunc)
      .catch(utils.failureHandler({ id: 'enrollments' }));
  }
  loadEnrollments(self.query);
};
