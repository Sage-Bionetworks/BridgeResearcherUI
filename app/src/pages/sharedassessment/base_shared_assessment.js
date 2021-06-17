import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import utils from "../../utils";
import root from "../../root";

export default class SharedAssessmentBase {
  constructor(params, id) {
    this.assessment = null;
    this.guid = params.guid;

    fn.copyProps(this, fn, "formatDateTime");

    this.binder = new Binder(this)
      .obs("guid")
      .obs("createdOn")
      .obs("modifiedOn")
      .obs("pageTitle")
      .obs("pageRev")
      .bind("title")
      .bind("version")
      .bind("ownerId")
      .bind("originGuid");

    this.failureHandler = utils.failureHandler({
      redirectMsg: "Shared assessment not found.",
      redirectTo: "sharedassessments",
      transient: false,
      id: id
    });
    this.osNameOpts = [
      {label: "Android", value: "Android"},
      {label: "iOS", value: "iPhone OS"},
      {label: "Both (Universal)", value: "Universal"}
    ];
  }
  canEdit() {
    return root.isAdmin() || root.isSuperadmin();
  }
  saveAssessment() {
    return serverService.updateSharedAssessment(this.assessment)
      .then(this.binder.assign("assessment"))
      .then(this.binder.update())
      .then(fn.handleObsUpdate(this.pageTitleObs, "title"))
      .then(fn.handleObsUpdate(this.pageRevObs, "revision"))
      .then(fn.handleObsUpdate(this.originGuidObs, "originGuid"))
      .then(fn.handleObsUpdate(this.guidObs, "guid"))
      .then(fn.returning(this.assessment));
  }
  load() {
    return serverService.getSharedAssessment(this.guid)
      .then(this.binder.assign("assessment"))
      .then(this.binder.update())
      .then(fn.handleObsUpdate(this.pageTitleObs, "title"))
      .then(fn.handleObsUpdate(this.pageRevObs, "revision"));
  }
  save(vm, event) {
    this.assessment = this.binder.persist(this.assessment);

    utils.startHandler(vm, event);
    this.saveAssessment()
      .then(utils.successHandler(vm, event, "Shared assessment has been saved."))
      .catch(this.failureHandler);
  }
}
