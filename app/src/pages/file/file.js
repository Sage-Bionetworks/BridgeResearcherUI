import Binder from "../../binder";
import fn from "../../functions";
import serverService from "../../services/server_service";
import utils from "../../utils";

let failureHandler = utils.failureHandler({
  redirectMsg: "File not found.",
  redirectTo: "files",
  transient: false
});

export default function editor(params) {
  let self = this;
  self.formatDateTime = fn.formatDateTime;

  let binder = new Binder(self)
    .obs("isNew", params.guid === "new")
    .obs("title", "New File")
    .bind("name")
    .bind("guid")
    .bind("description")
    .bind("mimeType")
    .bind("createdOn")
    .bind("modifiedOn")
    .bind("version");

  function updateModifiedOn(response) { 
    self.modifiedOnObs(new Date().toISOString());
    return response;
  }
  function saveFile(file) {
    if (self.isNewObs()) {
      return serverService.createFile(file.guid, file).then(response => {
        document.location = "#/files/" + response.guid;
        return response;
      });
    }
    return serverService.updateFile(file.guid, file)
      .then(updateModifiedOn)
      .then(fn.handleObsUpdate(self.versionObs, "version"))
      .then(fn.handleStaticObsUpdate(self.isNewObs, false));
  }
  function load() {
    if (self.isNewObs()) {
      return Promise.resolve({version:0})
        .then(binder.assign("file"))
        .then(binder.update());
    } else {
      return serverService.getFile(params.guid)
        .then(binder.assign("file"))
        .then(binder.update())
        .then(fn.handleObsUpdate(self.titleObs, "name"))
        .catch(failureHandler);
    }
  }

  self.save = function(vm, event) {
    self.file = binder.persist(self.file);

    utils.startHandler(vm, event);
    saveFile(self.file)
      .then(utils.successHandler(vm, event, "File has been saved."))
      .catch(failureHandler);
  };
  load();
};
