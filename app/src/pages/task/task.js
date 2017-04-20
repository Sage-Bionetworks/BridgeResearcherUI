var sharedModuleUtils = require('../../shared_module_utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');
var utils = require('../../utils');
var root = require('../../root');
var fn = require('../../transforms');
var ko = require('knockout');

var surveyNameMap = {};
var schemaNameMap = {};

function schemaListToView(schemaList, context) {
    return schemaList.map(schemaToView).map(loadSchemaRevisions);
}
function schemaToView(schema) {
    return {
        id: schema.schemaId || schema.id, 
        name: schemaNameMap[schema.schemaId || schema.id],
        revision: schema.revision,
        revisionObs: ko.observable(schema.revision),
        revisionList: ko.observableArray([schemaToOption(schema)])
    };
}
function schemaListToTask(schemaList, context) {
    return schemaList.map(function(schema) {
        var obj = {id: schema.id};
        if (schema.revisionObs()) {
            obj.revision = schema.revisionObs();
        }
        return obj;
    });
}
function surveyListToView(surveyList, context) {
    return surveyList.map(surveyToView).map(loadSurveyRevisions);
}
function surveyToView(survey) {
    return {
        name: surveyNameMap[survey.guid],
        guid: survey.guid,
        createdOn: survey.createdOn,
        createdOnObs: ko.observable(survey.createdOn),
        createdOnList: ko.observableArray([surveyToOption(survey)])
    };
}
function surveyListToTask(surveyList, context) {
    return surveyList.map(function(survey) {
        var obj = {guid: survey.guid};
        if (survey.createdOnObs()) {
            obj.createdOn = survey.createdOnObs();
        }
        return obj;
    });
}
function loadSurveyRevisions(newSurvey) {
    serverService.getSurveyAllRevisions(newSurvey.guid).then(function(response) {
        newSurvey.createdOnList(response.items.filter(function(survey) {
            return survey.published;  
        }).map(surveyToOption));
    });
    return newSurvey;
}
function loadSchemaRevisions(newSchema) {
    serverService.getUploadSchemaAllRevisions(newSchema.id).then(function(response) {
        newSchema.revisionList(response.items.filter(function(schema) {
            return schema.revision;
        }).map(schemaToOption));
    });
    return newSchema;
}
function surveyToOption(survey) {
    return {label: fn.formatLocalDateTime(survey.createdOn), value: survey.createdOn};
}
function schemaToOption(schema) {
    return {label: schema.revision, value: schema.revision};
}
module.exports = function(params) {
    var self = this;

    self.formatDateTime = fn.formatLocalDateTime;
    self.task = {};

    var binder = bind(self)
        .bind('isNew', params.taskId === "new")
        .bind('taskId', params.taskId === "new" ? null : params.taskId)
        .bind('schemaList[]', [], schemaListToView, schemaListToTask)
        .bind('surveyList[]', [], surveyListToView, surveyListToTask)
        .obs('schemaIndex')
        .obs('surveyIndex')
        .obs('name', params.taskId === "new" ? "New Task" : params.taskId);

    function updateId(response) {
        self.nameObs(response.taskId);
        self.isNewObs(false);
        params.taskId = response.taskId; 
        self.task.version = response.version;
    }

    self.openSchemaSelector = function() { 
        self.task = binder.persist(self.task);
        root.openDialog('select_schemas',{
            addSchemas: self.addSchemas,
            allowMostRecent: true,
            selected: self.task.schemaList
        });
    };
    self.openSurveySelector = function() { 
        self.task = binder.persist(self.task);
        root.openDialog('select_surveys',{
            addSurveys: self.addSurveys,
            allowMostRecent: true,
            selected: self.task.surveyList
        });
    };
    self.addSchemas = function(schemas) {
        self.schemaListObs([]);
        for (var i=0; i < schemas.length; i++) {
            var newSchema = schemaToView(schemas[i]);
            self.schemaListObs.push(newSchema);
            loadSchemaRevisions(newSchema);
        }
        root.closeDialog();
    };
    self.addSurveys = function(surveys) {
        self.surveyListObs([]);
        for (var i=0; i < surveys.length; i++) {
            var newSurvey = surveyToView(surveys[i]);
            self.surveyListObs.push(newSurvey);
            loadSurveyRevisions(newSurvey);
        }
        root.closeDialog();
    };
    self.removeSchema = function(object, event) {
        self.schemaListObs.remove(object);
    };
    self.removeSurvey = function(object, event) {
        self.surveyListObs.remove(object);
    };
    self.save = function(vm, event) {
        utils.startHandler(vm, event);

        var methodName = (params.taskId === "new") ? "createTaskDefinition" : "updateTaskDefinition";
        self.task = binder.persist(self.task);

        serverService[methodName](self.task)
            .then(updateId)
            .then(utils.successHandler(vm, event, "Task saved."))
            .catch(utils.failureHandler());
    };

    if (params.taskId !== "new") {
        sharedModuleUtils.loadNameMaps(surveyNameMap, schemaNameMap)
            .then(function() {
                return serverService.getTaskDefinition(params.taskId)
                    .then(binder.assign('task'))
                    .then(binder.update())
                    .catch(utils.notFoundHandler("Task", "tasks"));
            });
    }
};