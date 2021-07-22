import alerts from "../../widgets/alerts";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";
import BaseStudy from "./base_study";

const OPTIONS = [
  {label: 'Enrolled', value: 'enrolled'},
  {label: 'Withdrawn', value: 'withdrawn'},
  {label: 'Both', value: 'all'}
];

export default class StudyEnrollments extends BaseStudy {
  constructor(params) {
    super(params, 'enrollments');
    
    this.options = OPTIONS;
    this.query = {pageSize: 10, enrollmentFilter: 'all', includeTesters: false};
    this.postLoadPagerFunc = fn.identity;
    this.postLoadFunc = (func) => this.postLoadPagerFunc = func;
    fn.copyProps(this, fn, "formatDateTime", "formatNameAsFullLabel");

    this.binder
      .obs("includeTesters", false)
      .obs("enrollmentFilter", "both");

    this.includeTestersObs.subscribe(() => this.loadEnrollments(this.query));
    this.enrollmentFilterObs.subscribe(() => this.loadEnrollments(this.query));

    tables.prepareTable(this, {
      name: "enrollee",
      type: "Enrollee",
      id: "enrollments",
      refresh: () => this.loadEnrollments(this.query)
    });

    ko.postbox.subscribe('en-refresh', this.loadEnrollments.bind(this));
    
    super.load();
  }
  formatParticipant(en) {
    let p = en.participant;
    p.externalId = en.externalId;
    return fn.formatNameAsFullLabel(p);
  }
  enrollDialog () {
    root.openDialog("add_enrollment", {
      closeFunc: fn.seq(root.closeDialog, () => {
        this.query.offsetBy = 0;
        this.loadEnrollments(this.query)
      }),
      studyId: this.studyId
    });
  }
  unenroll(item, event) {
    alerts.prompt("Why are you withdrawing this person?", (withdrawalNote) => {
      utils.startHandler(this, event);
      serverService.unenroll(this.studyId, item.participant.identifier, withdrawalNote)
        .then(() => this.loadEnrollments(this.query))
        .then(utils.successHandler(this, event, "Participant removed from study."))
        .catch(this.failureHandler);
    });
  }
  loadEnrollments(query) {
    // some state is not in the pager, update that and capture last known state of paging
    this.query = query;
    this.query.enrollmentFilter = this.enrollmentFilterObs();
    this.query.includeTesters = this.includeTestersObs();

    serverService.getEnrollments(this.studyId, this.query)
      .then(this.postLoadPagerFunc)
      .then(fn.handleObsUpdate(this.itemsObs, "items"))
      .catch(this.failureHandler);
  }
}
