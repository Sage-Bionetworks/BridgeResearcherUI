import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default class BaseStudy {
  constructor(params, id, tab) {
    this.study = {};
    this.studyId = params.studyId;
    this.tab = tab; // for redirects
    this.failureHandler = utils.failureHandler({
      redirectMsg: "Study not found.",
      redirectTo: "studies",
      transient: false,
      id: id
    });
    
    this.binder = new Binder(this)
      .obs("createdOn")
      .obs("modifiedOn")
      .obs("title", "New Study")
      .obs("isNew", this.studyId === "new")
      .obs("phase")
      .bind("version")
      .bind("identifier", this.studyId === "new" ? null : this.studyId);
  }
  canEdit() {
    return root.isDeveloper() || root.isStudyDesigner() || root.isAdmin();
  }
  load() {
    return this.studyId === "new" ? 
      Promise.resolve({}) : 
      serverService.getStudy(this.studyId)
        .then(fn.handleObsUpdate(this.titleObs, "name"))
        .then(this.binder.assign('study'))
        .then(this.binder.update())
        .catch(this.failureHandler);
  }
  createStudy(vm, event) {
      serverService.createStudy(this.study)
        .then(utils.successHandler(vm, event, "Study has been saved."))
        .then(() => document.location = `#/studies/${this.identifierObs()}/${this.tab}`)
        .catch(this.failureHandler);
  }
  updateStudy(vm, event) {
      serverService.updateStudy(this.study)
        .then(fn.handleStaticObsUpdate(this.isNewObs, false))
        .then(fn.handleObsUpdate(this.versionObs, "version"))
        .then(fn.handleStaticObsUpdate(this.modifiedOnObs, new Date()))
        .then(this.updateModifiedOn.bind(this))
        .then(fn.returning(this.study))
        .then(fn.handleObsUpdate(this.titleObs, "name"))
        .then(utils.successHandler(vm, event, "Study has been saved."))
        .catch(this.failureHandler);
  }
  updateModifiedOn(response) {
    this.studyId = this.identifierObs();
    this.modifiedOnObs(response.modifiedOn);
    return response;
  }
  save(vm, event) {
    this.study = this.binder.persist(this.study);

    utils.startHandler(vm, event);
    if (this.isNewObs()) {
      this.createStudy(vm, event);
    } else {
      this.updateStudy(vm, event);
    }
  }
}