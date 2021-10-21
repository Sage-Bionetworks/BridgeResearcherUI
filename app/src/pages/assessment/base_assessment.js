import Binder from "../../binder";
import fn from "../../functions";
import serverService from "../../services/server_service";
import utils from "../../utils";
import root from "../../root";

export default class BaseAssessment {
  constructor(params, id) {

    fn.copyProps(this, fn, "formatDateTime");
    fn.copyProps(this, params, "guid");

    this.failureHandler = utils.failureHandler({
      redirectMsg: "Assessment not found.",
      redirectTo: "assessments",
      transient: false,
      id: id
    });

    this.binder = new Binder(this)
      .obs('pageTitle', 'New Assessment')
      .obs('isNew', params.guid === 'new')
      .obs('guid', params.guid)
      .obs('identifier')
      .obs('pageRev')
      .obs('originGuid')
      .obs('revision')
      .obs('createdOn')
      .obs('modifiedOn');
  }
  canEdit() {
    return root.isAdmin() || root.isStudyDesigner() || root.isDeveloper();
  }
  saveAssessment(revisionChanged) {
    if (this.isNewObs()) {
      return serverService.createAssessment(this.assessment)
        .then((response) => document.location = `/assessments/${response.guid}/general`);
    } else if (revisionChanged) {
      return serverService.createAssessmentRevision(this.assessment)
        .then((response) => document.location = `/assessments/${response.guid}/general`);
    } else {
      return serverService.updateAssessment(this.assessment)
        .then(fn.handleStaticObsUpdate(this.isNewObs, false))
        .then(this.binder.assign("assessment"))
        .then(this.binder.update())
        .then(fn.handleObsUpdate(this.pageTitleObs, "title"))
        .then(fn.handleObsUpdate(this.pageRevObs, "revision"))
        .then(fn.handleObsUpdate(this.originGuidObs, "originGuid"))
        .then(fn.handleObsUpdate(this.guidObs, "guid"))
        .then(fn.returning(this.assessment));
    }
  }
  load() {
    if (this.guidObs() === "new") {
      return Promise.resolve(this.newAssessment())
        .then(this.binder.assign("assessment"))
        .then(this.binder.update());
    } else {
      return serverService.getAssessment(this.guidObs())
        .then(this.binder.assign("assessment"))
        .then(this.binder.update())
        .then(fn.handleObsUpdate(this.pageTitleObs, "title"))
        .then(fn.handleObsUpdate(this.pageRevObs, "revision"));
    }
  }
  newAssessment() {
    return {
      title: "",
      identifier: "",
      summary: "",
      normingStatus: "",
      minutesToComplete: 1,
      validationStatus: "",
      osName: "",
      tags: [],
      revision: 1,
      labels: [],
      colorScheme: { background: null, foreground: null, activated: null, inactivated: null},
      customizationFields: {}
    };
  }
  save(vm, event) {
    this.isNewObs(!this.assessment.guid);
    let revisionChanged = this.revisionObs() !== this.assessment.revision;
    this.assessment = this.binder.persist(this.assessment);

    utils.startHandler(vm, event);
    this.saveAssessment(revisionChanged)
      .then(utils.successHandler(vm, event, "Assessment has been saved."))
      .catch(this.failureHandler);
  }
}