import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import jsonFormatter from "../../json_formatter";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import sharedModuleUtils from "../../shared_module_utils";
import Task from "../task/task";
import utils from "../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "App config not found.",
  redirectTo: "app_configs",
  transient: false,
  id: 'appconfig'
});

function newAppConfig() {
  return {
    label: "",
    clientData: {},
    criteria: criteriaUtils.newCriteria(),
    surveyReferences: [],
    schemaReferences: [],
    configReferences: [],
    fileReferences: [],
    configElements: {}
  };
}

export default function(params) {
  let self = this;
  self.appConfig = newAppConfig();

  let binder = new Binder(self)
    .obs("isNew", params.guid === "new")
    .obs("title", "New App Config")
    .obs("guid")
    .obs("createdOn")
    .obs("modifiedOn")
    .obs("schemaIndex")
    .obs("surveyIndex")
    .obs("configIndex")
    .obs("fileIndex")
    .obs("enablePreview", false)
    .obs("selectedTab", "schemas")
    .bind("version")
    .bind("label")
    .bind("criteria")
    .bind("clientData", null, Binder.fromJson, Binder.toJson)
    .bind("surveyReferences[]", [], Task.surveyListToView, Task.surveyListToTask)
    .bind("schemaReferences[]", [], Task.schemaListToView, Task.schemaListToTask)
    .bind("configReferences[]", [], Task.configListToView, Task.configListToTask)
    .bind("assessmentReferences[]", [], Task.assessmentListToView, Task.assessmentListToTask)
    .bind("fileReferences[]", [], Task.fileListToView, Task.fileListToTask);

  let titleUpdated = fn.handleObsUpdate(self.titleObs, "label");
  fn.copyProps(self, fn, "formatDateTime");

  function saveAppConfig() {
    self.enablePreviewObs(false);
    return self.appConfig.guid ? 
      serverService.updateAppConfig(self.appConfig) : 
      serverService.createAppConfig(self.appConfig);
  }
  function updateModifiedOn(response) {
    self.modifiedOnObs(new Date());
    return response;
  }
  function load() {
    if (params.guid === "new") {
      return Promise.resolve(newAppConfig())
        .then(binder.assign("appConfig"))
        .then(binder.update())
        .then(() => self.enablePreviewObs(true));
    } else {
      return serverService
        .getAppConfig(params.guid)
        .then(binder.assign("appConfig"))
        .then(binder.update())
        .then(titleUpdated)
        .then(() => self.enablePreviewObs(true));
    }
  }
  function updateClientData() {
    if (self.clientDataObs()) {
      try {
        let json = JSON.parse(self.clientDataObs());
        self.clientDataObs(jsonFormatter.prettyPrint(json));
      } catch (e) {
        let error = new BridgeError();
        error.addError("clientData", "is not valid JSON");
        utils.failureHandler({ transient: false, id: 'appconfig' })(error);
        return true;
      }
    }
    return false;
  }

  self.setTab = function(vm, e) {
    self.selectedTabObs(e.target.dataset.tab);
  };
  self.isActive = function(tab) {
    return ko.computed(() => (self.selectedTabObs() === tab ? "active" : ""));
  };

  self.openSchemaSelector = function(vm, event) {
    self.appConfig = binder.persist(self.appConfig);
    root.openDialog("select_schemas", {
      addSchemas: self.addSchemas.bind(self),
      allowMostRecent: true,
      selected: self.appConfig.schemaReferences
    });
  };
  self.openSurveySelector = function(vm, event) {
    self.appConfig = binder.persist(self.appConfig);
    root.openDialog("select_surveys", {
      addSurveys: self.addSurveys.bind(self),
      allowMostRecent: true,
      selected: self.appConfig.surveyReferences
    });
  };
  self.openConfigSelector = function(vm, event) {
    self.appConfig = binder.persist(self.appConfig);
    root.openDialog("select_configs", {
      addConfigs: self.addConfigs.bind(self),
      selected: self.appConfig.configReferences
    });
  };
  self.openFileSelector = function(vm, event) {
    self.appConfig = binder.persist(self.appConfig);
    root.openDialog("select_files", {
      addFiles: self.addFiles.bind(self),
      allowMostRecent: true,
      selected: self.appConfig.fileReferences
    });
  }
  self.openAssessmentSelector = function(vm, event) {
    self.appConfig = binder.persist(self.appConfig);
    root.openDialog("select_assessments", {
      addAssessments: self.addAssessments.bind(self),
      selected: self.appConfig.assessmentReferences
    });
  }
  self.addSchemas = function(schemas) {
    self.schemaReferencesObs([]);
    for (let i = 0; i < schemas.length; i++) {
      let newSchema = Task.schemaToView(schemas[i]);
      this.schemaReferencesObs.push(newSchema);
      Task.loadSchemaRevisions(newSchema);
    }
    root.closeDialog();
  };
  self.addSurveys = function(surveys) {
    self.surveyReferencesObs([]);
    for (let i = 0; i < surveys.length; i++) {
      let newSurvey = Task.surveyToView(surveys[i]);
      self.surveyReferencesObs.push(newSurvey);
      Task.loadSurveyRevisions(newSurvey);
    }
    root.closeDialog();
  };
  self.addConfigs = function(configs) {
    self.configReferencesObs([]);
    for (let i = 0; i < configs.length; i++) {
      let newConfig = Task.configToView(configs[i]);
      this.configReferencesObs.push(newConfig);
      Task.loadConfigRevisions(newConfig);
    }
    root.closeDialog();
  };
  self.addFiles = function(files) {
    self.fileReferencesObs([]);
    for (let i = 0; i < files.length; i++) {
      let newFile = Task.fileToView(files[i]);
      this.fileReferencesObs.push(newFile);
      Task.loadFileRevisions(newFile);
    }
    root.closeDialog();
  };
  self.addAssessments = function(assessments) {
    self.assessmentReferencesObs([]);
    for (let i = 0; i < assessments.length; i++) {
      let newAssessment = Task.assessmentToView(assessments[i]);
      this.assessmentReferencesObs.push(newAssessment);
    }
    root.closeDialog();
  };
  self.removeSchema = function(object, event) {
    self.schemaReferencesObs.remove(object);
  };
  self.removeSurvey = function(object, event) {
    this.surveyReferencesObs.remove(object);
  };
  self.removeConfig = function(object, event) {
    this.configReferencesObs.remove(object);
  };
  self.removeFile = function(object, event) {
    this.fileReferencesObs.remove(object);
  }
  self.removeAssessment = function(object, event) {
    this.assessmentReferencesObs.remove(object);
  }
  self.preview = function(vm, event) {
    if (updateClientData()) {
      return;
    }
    self.appConfig = binder.persist(self.appConfig);
    root.openDialog("preview_appconfig", {
      appConfig: self.appConfig
    });
  };
  self.save = function(vm, event) {
    if (updateClientData()) {
      return;
    }
    self.appConfig = binder.persist(self.appConfig);

    utils.startHandler(vm, event);
    saveAppConfig()
      .then(fn.handleStaticObsUpdate(self.isNewObs, false))
      .then(fn.handleObsUpdate(self.guidObs, "guid"))
      .then(fn.handleObsUpdate(self.versionObs, "version"))
      .then(fn.handleCopyProps(params, "guid"))
      .then(updateModifiedOn)
      .then(fn.returning(self.appConfig))
      .then(titleUpdated)
      .then(() => self.enablePreviewObs(true))
      .then(utils.successHandler(vm, event, "App configuration has been saved."))
      .catch(failureHandler);
  };
  self.reformat = function() {
    utils.clearErrors();
    updateClientData();
  };

  sharedModuleUtils.loadNameMaps()
    .then(load)
    .catch(failureHandler);
};
