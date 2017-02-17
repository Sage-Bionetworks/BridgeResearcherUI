var serverService = require('../../services/server_service');
var bind = require('../../binder');
var utils = require('../../utils');
var ko = require('knockout');

function schemaListToView(schemaList, context) {
    return schemaList.map(function(schema) {
        return {
            idObs: ko.observable(schema.id), 
            revisionObs: ko.observable(schema.revision)
        };
    });
}
function schemaListToTask(schemaList, context) {
    return schemaList.map(function(schema) {
        return {id: schema.idObs(), revision: schema.revisionObs()};
    });
}
function surveyListToView(surveyList, context) {
}
function surveyListToTask(surveyList, context) {
}

module.exports = function(params) {
    var self = this;

    var binder = bind(self)
        .bind('taskId', params.taskId === "new" ? null : params.taskId)
        .bind('schemaList[]', [], schemaListToView, schemaListToTask)
        .bind('surveyList[]', [], surveyListToView, surveyListToTask)
        .obs('name', params.taskId === "new" ? "New Task" : params.taskId);

    function updateId(response) {
        self.taskIdObs(repsonse.taskId);
    }

    self.addSchema = function() {
        self.schemaListObs.push({
            id: ko.observable(), 
            revision: ko.observable()
        });
    };
    self.removeSchema = function() {
        console.log(arguments);
    };

    self.save = function(vm, event) {
        utils.startHandler(vm, event);

        self.task = binder.persist(self.task);
        if (self.taskIdObs() === "new") {
            serverService.createTaskDefinition(self.task)
                .then(updateId)
                .then(utils.successHandler(vm, event, "Task created."))
                .catch(utils.failureHandler());
        } else {
            serverService.updateTaskDefinition(self.task)
                .then(utils.successHandler(vm, event, "Task created."))
                .catch(utils.failureHandler());
        }
    };

    self.task = {};

    if (params.taskId !== "new") {
        serverService.getTaskDefinition(params.taskId)
        .then(binder.assign('task'))
        .then(binder.update())
        .then(function(response) {
        }).catch(utils.notFoundHandler("Task", "tasks"));
    }

    // schemaList (schema references)
    // surveyList (survey references)
};