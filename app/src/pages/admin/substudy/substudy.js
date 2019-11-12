import Binder from "../../../binder";
import fn from "../../../functions";
import serverService from "../../../services/server_service";
import utils from "../../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "Substudy not found.",
  redirectTo: "admin/substudies",
  transient: false,
  id: 'substudy'
});

export default function(params) {
  let self = this;
  self.substudy = {};

  fn.copyProps(self, fn, "formatDateTime");

  let binder = new Binder(self)
    .obs("title", "New Substudy")
    .obs("isNew", params.id === "new")
    .obs("createdOn")
    .obs("modifiedOn")
    .bind("version")
    .bind("name")
    .bind("id", params.id === "new" ? null : params.id);

  function load() {
    return params.id === "new" ? 
      Promise.resolve({}) : 
      serverService.getSubstudy(params.id).then(fn.handleObsUpdate(self.titleObs, "name"));
  }
  function saveSubstudy() {
    return params.id === "new" ? 
      serverService.createSubstudy(self.substudy) : 
      serverService.updateSubstudy(self.substudy);
  }
  function updateModifiedOn(response) {
    params.id = self.idObs();
    return response;
  }

  self.save = function(vm, event) {
    self.substudy = binder.persist(self.substudy);

    utils.startHandler(vm, event);
    saveSubstudy()
      .then(response => {
        if (params.id === "new") {
          document.location = "#/admin/substudies/" + self.idObs();
        }
        return response;
      })
      .then(fn.handleStaticObsUpdate(self.isNewObs, false))
      .then(fn.handleObsUpdate(self.versionObs, "version"))
      .then(fn.handleStaticObsUpdate(self.modifiedOnObs, new Date()))
      .then(updateModifiedOn)
      .then(fn.returning(self.substudy))
      .then(fn.handleObsUpdate(self.titleObs, "name"))
      .then(utils.successHandler(vm, event, "Sub-study has been saved."))
      .catch(failureHandler);
  };

  load()
    .then(binder.assign("study"))
    .then(binder.update());
};
