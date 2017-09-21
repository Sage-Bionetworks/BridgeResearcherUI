import Binder from '../../binder';
import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import serverService from '../../services/server_service';
import sharedModuleUtils from '../../shared_module_utils';
import utils from '../../utils';

/**
 * This is written as an ES6 class, rather than the functional approach taken elsewhere. 
 * I feel "meh" about the difference, but I'll leave it here for the moment. You start 
 * to have to track "this" references which can be annoying. It's also more verbose 
 * because there's no use of closures.
 * 
 * One thing I found is that $component.function references in the template do not have
 * the correct this reference... which is practically a show stopper by itself.
 */
module.exports = class Task {
    constructor(params) {
        this.taskId = params.taskId;
        this.task = {};

        fn.copyProps(this, fn, 'formatDateTime');

        this.binder = new Binder(this)
            .bind('isNew', params.taskId === "new")
            .bind('taskId', params.taskId === "new" ? null : params.taskId)
            .bind('schemaList[]', [], Task.schemaListToView, Task.schemaListToTask)
            .bind('surveyList[]', [], Task.surveyListToView, Task.surveyListToTask)
            .obs('schemaIndex')
            .obs('surveyIndex')
            .obs('name', params.taskId === "new" ? "New Task" : params.taskId);
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
        root.openDialog('select_schemas', {
            addSchemas: this.addSchemas.bind(this),
            allowMostRecent: true,
            selected: this.task.schemaList
        });
    }
    openSurveySelector() { 
        this.task = this.binder.persist(this.task);
        root.openDialog('select_surveys',{
            addSurveys: this.addSurveys.bind(this),
            allowMostRecent: true,
            selected: this.task.surveyList
        });
    }
    addSchemas(schemas) {
        this.schemaListObs([]);
        for (var i=0; i < schemas.length; i++) {
            var newSchema = Task.schemaToView(schemas[i]);
            this.schemaListObs.push(newSchema);
            Task.loadSchemaRevisions(newSchema);
        }
        root.closeDialog();
    }
    addSurveys(surveys) {
        this.surveyListObs([]);
        for (var i=0; i < surveys.length; i++) {
            var newSurvey = Task.surveyToView(surveys[i]);
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

        var methodName = (this.taskId === "new") ? "createTaskDefinition" : "updateTaskDefinition";
        this.task = this.binder.persist(this.task);

        serverService[methodName](this.task)
            .then(this.updateId.bind(this))
            .then(utils.successHandler(vm, event, "Task saved."))
            .catch(utils.failureHandler());
    }
    loadTaskDefinition() {
        if (this.taskId !== "new") {
            return serverService.getTaskDefinition(this.taskId)
                .then(this.binder.assign('task'))
                .then(this.binder.update())
                .catch(utils.failureHandler({
                    redirectTo: "tasks",
                    redirectMsg: "Task not found."
                }));
        }
    }    
    load() {
        sharedModuleUtils.loadNameMaps()
            .then(this.loadTaskDefinition.bind(this))
            .catch(utils.failureHandler());
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
            var obj = {id: schema.id};
            if (schema.revisionObs()) {
                obj.revision = schema.revisionObs();
            }
            return obj;
        });
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
            var obj = {guid: survey.guid};
            if (survey.createdOnObs()) {
                obj.createdOn = survey.createdOnObs();
            }
            return obj;
        });
    }
    static loadSurveyRevisions(surveyRef) {
        serverService.getSurveyAllRevisions(surveyRef.guid).then(function(response) {
            surveyRef.createdOnList(response.items.filter(function(survey) {
                return survey.published;
            }).map(Task.surveyToOption));
        });
        return surveyRef;
    }
    static loadSchemaRevisions(newSchema) {
        serverService.getUploadSchemaAllRevisions(newSchema.id).then(function(response) {
            newSchema.revisionList(response.items.filter(function(schema) {
                return schema.revision;
            }).map(Task.schemaToOption));
        });
        return newSchema;
    }
    static surveyToOption(survey) {
        return {label: fn.formatDateTime(survey.createdOn), value: survey.createdOn};
    }
    static schemaToOption(schema) {
        return {label: schema.revision, value: schema.revision};
    }
};
