import * as schemaUtils from "../../pages/schema/schema_utils";
import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

const failureHandler = utils.failureHandler({
  redirectTo: "app",
  redirectMsg: "App not found.",
  transient: false,
  id: 'shared-upload-metadata'
});

export default function sharedUploadMetadata(params) {
  let self = this;

  new Binder(this)
    .obs("index", 0)
    .bind("fieldDefinitions[]", [])
    .bind("version");

  self.save = function(vm, event) {
    if (!self.app) {
      return;
    }
    utils.startHandler(vm, event);

    self.app.uploadMetadataFieldDefinitions = schemaUtils.fieldObsToDef(self.fieldDefinitionsObs());
    serverService.saveApp(self.app)
      .then(fn.handleObsUpdate(self.versionObs, "version"))
      .then(utils.successHandler(vm, event, "Upload metadata fields have been saved."))
      .catch(utils.failureHandler({ id: 'shared-upload-metadata' }));
  };
  self.addBelow = function(field, event) {
    let index = self.fieldDefinitionsObs.indexOf(field);
    let newField = schemaUtils.makeNewField();
    self.fieldDefinitionsObs.splice(index + 1, 0, newField);
  };
  self.addFirst = function(vm, event) {
    let field = schemaUtils.makeNewField();
    self.fieldDefinitionsObs.push(field);
  };
  self.editMultiChoiceAnswerList = function(field, event) {
    let otherLists = self.fieldDefinitionsObs()
      .filter((oneField) => oneField.typeObs() === "multi_choice" && oneField.multiChoiceAnswerListObs().length)
      .map((oneField) => [].concat(oneField.multiChoiceAnswerListObs()));
    root.openDialog("multichoice_editor", {
      listObs: field.multiChoiceAnswerListObs,
      otherLists: otherLists
    });
  };

  serverService.getApp()
    .then(function(app) {
      self.app = app;
      self.fieldDefinitionsObs(schemaUtils.fieldDefToObs(app.uploadMetadataFieldDefinitions));
      return app;
    })
    .catch(failureHandler);
};
