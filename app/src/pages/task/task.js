var serverService = require('../../services/server_service');
var bind = require('../../binder');
var utils = require('../../utils');
var root = require('../../root');
var fn = require('../../transforms');
var ko = require('knockout');

var surveyNameMap = {};

function schemaListToView(schemaList, context) {
    return schemaList.map(schemaToView).map(loadSchemaRevisions);
}
function schemaToView(schema) {
    return {
        id: schema.schemaId || schema.id, 
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
    var obj = {
        name: surveyNameMap[survey.guid],
        guid: survey.guid,
        createdOn: survey.createdOn,
        createdOnObs: ko.observable(survey.createdOn),
        createdOnList: ko.observableArray([surveyToOption(survey)])
    };
    return obj;
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

    function updateSurveyNameMap(response) {
        response.items.forEach(function(survey) {
            surveyNameMap[survey.guid] = survey.name;
        });
        return response;
    }
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
            selected: self.task.schemaList
        });
    };
    self.openSurveySelector = function() { 
        self.task = binder.persist(self.task);
        root.openDialog('select_surveys',{
            addSurveys: self.addSurveys,
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

        self.task = binder.persist(self.task);
        if (params.taskId === "new") {
            serverService.createTaskDefinition(self.task)
                .then(updateId)
                .then(utils.successHandler(vm, event, "Task created."))
                .catch(utils.failureHandler());
        } else {
            serverService.updateTaskDefinition(self.task)
                .then(updateId)
                .then(utils.successHandler(vm, event, "Task created."))
                .catch(utils.failureHandler());
        }
    };

    if (params.taskId !== "new") {
        serverService.getPublishedSurveys()
            .then(updateSurveyNameMap)
            .then(function() {
                return serverService.getTaskDefinition(params.taskId)
                    .then(binder.assign('task'))
                    .then(binder.update())
                    .catch(utils.notFoundHandler("Task", "tasks"));
            });
    }
};