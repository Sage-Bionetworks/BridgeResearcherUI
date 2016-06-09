var ko = require('knockout');
var serverService = require('../../services/server_service');
var schemaUtils = require('../schema/schema_utils');
var utils = require('../../utils');
var bind = require('../../binder');

module.exports = function(params) {
    var self = this;
    var scrollTo = utils.makeScrollTo(".ui.warning.message");

    schemaUtils.initVM(self);

    var binder = bind(self)
        .bind('isNew', params.schemaId === "new")
        .bind('schemaId', params.schemaId)
        .bind('schemaType')
        .bind('revision', params.revision ? params.revision : null)
        .bind('showError', false)
        .bind('name', '')
        .bind('fieldDefinitions[]', [], fieldDefToObs, fieldObsToDef);

    self.revisionLabel = ko.computed(function() {
        if (self.revisionObs()) {
            return 'v' + self.revisionObs();
        }
        return '';
    });

    function fieldDefToObs(fieldDefinitions) {
        return fieldDefinitions.map(function(def) {
            bind(def)
                .bind('name', def.name)
                .bind('required', def.required)
                .bind('minAppVersion', def.minAppVersion)
                .bind('maxAppVersion', def.maxAppVersion)
                .bind('type', def.type);
            return def;
        });
    }
    function fieldObsToDef(fieldDefinitions) {
        return fieldDefinitions.map(function(item) {
            return {
                name: item.nameObs(),
                required: item.requiredObs(),
                type: item.typeObs(),
                minAppVersion: item.minAppVersionObs(),
                maxAppVersion: item.maxAppVersionObs()
            };
        });
    }
    function newField() {
        return fieldDefToObs([{
            name:'', required:false, type:'attachment_blob', minAppVersion:'', maxAppVersion:''
        }])[0];
    }    
    function hideWarning() {
        self.showErrorObs(false);
    }
    function updateRevision(response) {
        self.revisionObs(response.revision);
        self.isNewObs(false);
        return response;
    }
    function handleError(failureHandler) {
        return function(response) {
            if (response.status === 400 && typeof response.responseJSON.errors === "undefined") {
                self.showErrorObs(true);
                utils.clearPendingControl();
                scrollTo(0);
            } else {
                failureHandler(response);
            }
        };
    }

    self.save = function(vm, event) {
        utils.startHandler(vm, event);

        self.schema = binder.persist(self.schema);
        if (self.isNewObs()) {
            serverService.createUploadSchema(self.schema)
                .then(updateRevision)
                .then(utils.successHandler(vm, event, "Schema has been saved."))
                .catch(utils.failureHandler(vm, event));            
        } else {
            // Try and save. If it fails, offer the opportunity to the user to create a new revision.
            serverService.updateUploadSchema(self.schema)
                .then(updateRevision)
                .then(utils.successHandler(vm, event, "Schema has been saved."))
                .catch(handleError(utils.failureHandler(vm, event)));
        }
    };

    self.addBelow = function(vm, event) {
        var index = self.fieldDefinitionsObs.indexOf(vm.field);
        var field = newField();
        self.fieldDefinitionsObs.splice(index+1,0,field);
    };
    self.addFirst = function(vm, event) {
        var field = newField();
        self.fieldDefinitionsObs.push(field);
    };
    self.saveNewRevision = function(vm, event) {
        self.schema.revision++;
        delete self.schema.version;

        utils.startHandler(vm, event);
        serverService.createUploadSchema(self.schema)
            .then(updateRevision)
            .then(utils.successHandler(vm, event, "Schema has been saved at new revision."))
            .then(hideWarning)
            .catch(utils.failureHandler(vm, event));
    };
    self.closeWarning = hideWarning;

    var notFoundHandler = utils.notFoundHandler(self, "Upload schema not found.", "#/schemas");

    var promise = null;
    if (params.schemaId === "new") {
        promise = Promise.resolve({name:'',schemaId:'',schemaType:'ios_data',revision:null,fieldDefinitions:[{
            name:'', required:false, type:'attachment_blob', minAppVersion:'', maxAppVersion:''
        }]});
    } else if (params.revision) {
        promise = serverService.getUploadSchema(params.schemaId, params.revision);
    } else {
        promise = serverService.getMostRecentUploadSchema(params.schemaId);
    }
    promise.then(binder.assign('schema'))
        .then(binder.update())
        .catch(notFoundHandler);
};
