import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "Study not found.",
  redirectTo: "studies",
  transient: false,
  id: 'study-ui'
});

export default function(params) {
  let self = this;
  self.study = {};

  fn.copyProps(self, fn, "formatDateTime");
  fn.copyProps(self, root, 'isDevRole');

  let binder = new Binder(self)
    .obs("title", "New Study")
    .obs("isNew", params.studyId === "new")
    .obs("createdOn")
    .obs("modifiedOn")
    .bind("version")
    .bind("contacts[]", [], null, Binder.persistArrayWithBinder)
    .bind("identifier", params.studyId === "new" ? null : params.studyId)
    .bind("studyLogoUrl")
    .bind("background", null, 
      Binder.fromObjectField("colorScheme", "background"),
      Binder.toObjectField("colorScheme", "background"))
    .bind("foreground", null, 
      Binder.fromObjectField("colorScheme", "foreground"),
      Binder.toObjectField("colorScheme", "foreground"))
    .bind("activated", null, 
      Binder.fromObjectField("colorScheme", "activated"),
      Binder.toObjectField("colorScheme", "activated"))
    .bind("inactivated", null, 
      Binder.fromObjectField("colorScheme", "inactivated"),
      Binder.toObjectField("colorScheme", "inactivated"));

  function load() {
    return params.studyId === "new" ? 
      Promise.resolve({}) : 
      serverService.getStudy(params.studyId).then(fn.handleObsUpdate(self.titleObs, "name"));
  }
  function createStudy(vm, event) {
      serverService.createStudy(self.study)
        .then(utils.successHandler(vm, event, "Study has been saved."))
        .then(() => document.location = `#/studies/${self.identifierObs()}/general`)
        .catch(failureHandler);
  }
  function updateStudy(vm, event) {
      serverService.updateStudy(self.study)
        .then(fn.handleStaticObsUpdate(self.isNewObs, false))
        .then(fn.handleObsUpdate(self.versionObs, "version"))
        .then(fn.handleStaticObsUpdate(self.modifiedOnObs, new Date()))
        .then(updateModifiedOn)
        .then(fn.returning(self.study))
        .then(fn.handleObsUpdate(self.titleObs, "name"))
        .then(utils.successHandler(vm, event, "Study has been saved."))
        .catch(failureHandler);

  }
  function updateModifiedOn(response) {
    params.studyId = self.identifierObs();
    self.modifiedOnObs(response.modifiedOn);
    return response;
  }

  self.addContact = function() {
    self.contactsObs.push({address: {}});
  };

  self.save = function(vm, event) {
    self.study = binder.persist(self.study);

    utils.startHandler(vm, event);
    if (self.isNewObs()) {
      createStudy(vm, event);
    } else {
      updateStudy(vm, event);
    }
  };

  load().then(binder.assign("study"))
    .then(binder.update())
    .catch(failureHandler);
};
