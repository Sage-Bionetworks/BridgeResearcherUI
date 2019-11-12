import * as schemaUtils from "./schema_utils";
import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

const failureHandler = utils.failureHandler({
  redirectTo: "schemas",
  redirectMsg: "Upload schema not found.",
  transient: false,
  id: 'schema'
});

export default function schema(params) {
  let self = this;
  self.schema = {};

  let minIos = Binder.objPropDelegates("minAppVersions", "iPhone OS");
  let minAnd = Binder.objPropDelegates("minAppVersions", "Android");
  let maxIos = Binder.objPropDelegates("maxAppVersions", "iPhone OS");
  let maxAnd = Binder.objPropDelegates("maxAppVersions", "Android");

  let binder = new Binder(self)
    .obs("isNew", params.schemaId === "new")
    .obs("showError", false)
    .obs("index", 0)
    .obs("title", "&#160;")
    .bind("schemaId", params.schemaId === "new" ? "" : params.schemaId)
    .bind("schemaType")
    .bind("revision", params.revision ? params.revision : null)
    .bind("name", "")
    .bind("moduleId")
    .bind("moduleVersion")
    .bind("iosMin", "", minIos.fromObject, minIos.toObject)
    .bind("iosMax", "", maxIos.fromObject, maxIos.toObject)
    .bind("androidMin", "", minAnd.fromObject, minAnd.toObject)
    .bind("androidMax", "", maxAnd.fromObject, maxAnd.toObject)
    .bind("fieldDefinitions[]", [], schemaUtils.fieldDefToObs, schemaUtils.fieldObsToDef);
  schemaUtils.initVM(self);

  let hideWarning = fn.handleStaticObsUpdate(self.showErrorObs, false);
  self.lastRevision = params.revision;
  let updateRevision = fn.seq(
    fn.handleObsUpdate(self.revisionObs, "revision"),
    fn.handleObsUpdate(self.moduleIdObs, "moduleId"),
    fn.handleObsUpdate(self.moduleVersionObs, "moduleVersion"),
    fn.handleCopyProps(self.schema, "version"),
    fn.handleCopyProps(self, "revision->lastRevision"),
    fn.handleConditionalObsUpdate(self.titleObs, "name"),
    fn.handleStaticObsUpdate(self.isNewObs, false)
  );
  function uploadSchema() {
    if (self.revisionObs() != self.lastRevision || self.isNewObs()) {
      return serverService.createUploadSchema(self.schema);
    } else {
      return serverService.updateUploadSchema(self.schema);
    }
  }

  self.save = function(vm, event) {
    utils.startHandler(vm, event);
    if (self.schema.moduleId) {
      self.moduleIdObs(null);
      self.moduleVersionObs(null);
      self.revisionObs(self.revisionObs() + 1);
    }
    self.schema = binder.persist(self.schema);
    uploadSchema()
      .then(updateRevision)
      .then(utils.successHandler(vm, event, "Schema has been saved."))
      .catch(failureHandler);
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
    let otherLists = self
      .fieldDefinitionsObs()
      .filter(function(oneField) {
        return oneField.typeObs() === "multi_choice" && oneField.multiChoiceAnswerListObs().length;
      })
      .map(function(oneField) {
        return [].concat(oneField.multiChoiceAnswerListObs());
      });
    root.openDialog("multichoice_editor", {
      listObs: field.multiChoiceAnswerListObs,
      otherLists: otherLists
    });
  };

  function loadSchema() {
    if (params.schemaId === "new") {
      self.titleObs("New Upload Schema");
      return Promise.resolve({ fieldDefinitions: [schemaUtils.makeNewField()] });
    } else if (params.revision) {
      return serverService.getUploadSchema(params.schemaId, params.revision);
    } else {
      return serverService.getMostRecentUploadSchema(params.schemaId);
    }
  }

  loadSchema()
    .then(binder.assign("schema"))
    .then(binder.update())
    .then(fn.handleConditionalObsUpdate(self.titleObs, "name"))
    .catch(failureHandler);
};
