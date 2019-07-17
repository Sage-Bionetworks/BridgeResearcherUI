import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import sharedModuleUtils from "../../shared_module_utils";
import utils from "../../utils";

const taskFailure = utils.failureHandler({
  redirectTo: "tasks",
  redirectMsg: "Task not found."
});

/**
 * This is written as an ES6 class, rather than the functional approach taken elsewhere.
 * I feel "meh" about the difference, but I'll leave it here for the moment. You start
 * to have to track "this" references which can be annoying. It's also more verbose
 * because there's no use of closures.
 *
 * One thing I found is that $component.function references in the template do not have
 * the correct this reference... which is practically a show stopper by itself.
 */
export default class Task {
  constructor(params) {
    this.taskId = params.taskId;
    this.task = {};

    fn.copyProps(this, fn, "formatDateTime");

    this.binder = new Binder(this)
      .bind("isNew", params.taskId === "new")
      .bind("taskId", params.taskId === "new" ? null : params.taskId)
      .bind("schemaList[]", [], Task.schemaListToView, Task.schemaListToTask)
      .bind("surveyList[]", [], Task.surveyListToView, Task.surveyListToTask)
      .obs("schemaIndex")
      .obs("surveyIndex")
      .obs("name", params.taskId === "new" ? "New Task" : params.taskId);
    this.load();
  }
  updateId(response) {
    this.nameObs(response.taskId);
    this.isNewObs(false);
    this.taskId = response.taskId;
    this.task.version = response.version;
  }
  openSchemaSelector() {
    this.task = this.binder.persist(this.task);
    root.openDialog("select_schemas", {
      addSchemas: this.addSchemas.bind(this),
      allowMostRecent: true,
      selected: this.task.schemaList
    });
  }
  openSurveySelector() {
    this.task = this.binder.persist(this.task);
    root.openDialog("select_surveys", {
      addSurveys: this.addSurveys.bind(this),
      allowMostRecent: true,
      selected: this.task.surveyList
    });
  }
  addSchemas(schemas) {
    this.schemaListObs([]);
    for (let i = 0; i < schemas.length; i++) {
      let newSchema = Task.schemaToView(schemas[i]);
      this.schemaListObs.push(newSchema);
      Task.loadSchemaRevisions(newSchema);
    }
    root.closeDialog();
  }
  addSurveys(surveys) {
    this.surveyListObs([]);
    for (let i = 0; i < surveys.length; i++) {
      let newSurvey = Task.surveyToView(surveys[i]);
      this.surveyListObs.push(newSurvey);
      Task.loadSurveyRevisions(newSurvey);
    }
    root.closeDialog();
  }
  removeSchema(object, event) {
    // had to use .bind() in the template... because of the $component.removeSchema syntax
    this.schemaListObs.remove(object);
  }
  removeSurvey(object, event) {
    // had to use .bind() in the template... because of the $component.removeSurvey syntax
    this.surveyListObs.remove(object);
  }
  save(vm, event) {
    utils.startHandler(vm, event);

    let methodName = this.taskId === "new" ? "createTaskDefinition" : "updateTaskDefinition";
    this.task = this.binder.persist(this.task);

    serverService[methodName](this.task)
      .then(this.updateId.bind(this))
      .then(utils.successHandler(vm, event, "Task saved."))
      .catch(utils.failureHandler());
  }
  loadTaskDefinition() {
    if (this.taskId !== "new") {
      return serverService
        .getTaskDefinition(this.taskId)
        .then(this.binder.assign("task"))
        .then(this.binder.update())
        .catch(taskFailure);
    }
  }
  load() {
    sharedModuleUtils
      .loadNameMaps()
      .then(this.loadTaskDefinition.bind(this))
      .catch(utils.failureHandler());
  }

  static configToView(config) {
    return {
      id: config.id,
      name: config.id,
      revision: config.revision,
      idObs: ko.observable(config.id),
      revisionObs: ko.observable(config.revision),
      revisionList: ko.observableArray([Task.configToOption(config)])
    };
  }
  static configListToView(configList, context) {
    return (configList || []).map(Task.configToView).map(Task.loadConfigRevisions);
  }
  static configListToTask(configList, context) {
    return configList.map(config => {
      return { id: config.idObs(), revision: config.revisionObs() };
    });
  }
  static loadConfigRevisions(newConfig) {
    serverService.getAppConfigElementRevisions(newConfig.id, false).then(response => {
      response.items.forEach(config => {
        if (newConfig.revisionList().every(opt => opt.value !== config.revision)) {
          newConfig.revisionList.push(Task.configToOption(config));
        }
      });
    });
    return newConfig;
  }
  static configToOption(config) {
    return { label: config.revision, value: config.revision };
  }

  static schemaListToView(schemaList, context) {
    return schemaList.map(Task.schemaToView).map(Task.loadSchemaRevisions);
  }
  static schemaToView(schema) {
    return {
      id: schema.schemaId || schema.id,
      name: sharedModuleUtils.getSchemaName(schema.schemaId || schema.id),
      revision: schema.revision,
      revisionObs: ko.observable(schema.revision),
      revisionList: ko.observableArray([Task.schemaToOption(schema)])
    };
  }
  static schemaListToTask(schemaList, context) {
    return schemaList.map(function(schema) {
      let obj = { id: schema.id };
      if (schema.revisionObs()) {
        obj.revision = schema.revisionObs();
      }
      return obj;
    });
  }
  static loadSchemaRevisions(newSchema) {
    serverService.getUploadSchemaAllRevisions(newSchema.id).then(function(response) {
      response.items.forEach(schema => {
        if (newSchema.revisionList().every(opt => opt.value !== schema.revision)) {
          newSchema.revisionList.push(Task.schemaToOption(schema));
        }
      });
    });
    return newSchema;
  }
  static schemaToOption(schema) {
    return { label: schema.revision, value: schema.revision };
  }

  static surveyListToView(surveyList, context) {
    return surveyList.map(Task.surveyToView).map(Task.loadSurveyRevisions);
  }
  static surveyToView(surveyRef) {
    return {
      name: sharedModuleUtils.getSurveyName(surveyRef.guid),
      guid: surveyRef.guid,
      createdOn: surveyRef.createdOn,
      createdOnObs: ko.observable(surveyRef.createdOn),
      createdOnList: ko.observableArray([Task.surveyToOption(surveyRef)])
    };
  }
  static surveyListToTask(surveyList, context) {
    return surveyList.map(function(survey) {
      let obj = { guid: survey.guid };
      if (survey.createdOnObs()) {
        obj.createdOn = survey.createdOnObs();
      }
      return obj;
    });
  }
  static loadSurveyRevisions(surveyRef) {
    serverService
      .getSurveyAllRevisions(surveyRef.guid)
      .then(response => {
        response.items = response.items.filter(survey => survey.published);
        return response;
      })
      .then(function(response) {
        response.items.forEach(survey => {
          if (surveyRef.createdOnList().every(opt => opt.value !== survey.createdOn)) {
            surveyRef.createdOnList.push(Task.surveyToOption(survey));
          }
        });
      });
    return surveyRef;
  }
  static surveyToOption(survey) {
    return { label: fn.formatDateTime(survey.createdOn), value: survey.createdOn };
  }
};
