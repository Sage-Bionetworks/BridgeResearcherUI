var ko = require('knockout');
var serverService = require('../../services/server_service');
var schemaUtils = require('../schema/schema_utils');
var utils = require('../../utils');
var bind = require('../../binder');

var FIELD_SKELETON = {
    name:'', required:false, type:null, unboundedText:false, maxLength:'100', fileExtension:'', mimeType:''
};

module.exports = function(params) {
    var self = this;
    var scrollTo = utils.makeScrollTo(".ui.warning.message");

    schemaUtils.initVM(self);

    var minIos = bind.objPropDelegates('minAppVersions', 'iPhone OS');
    var minAnd = bind.objPropDelegates('minAppVersions', 'Android');
    var maxIos = bind.objPropDelegates('maxAppVersions', 'iPhone OS');
    var maxAnd = bind.objPropDelegates('maxAppVersions', 'Android');

    var binder = bind(self)
        .obs('isNew', params.schemaId === "new")
        .bind('schemaId', params.schemaId)
        .bind('schemaType')
        .bind('revision', params.revision ? params.revision : null)
        .obs('showError', false)
        .bind('name', '')
        .obs('index', 0)
        .bind('iosMin', '', minIos.fromObject, minIos.toObject)
        .bind('iosMax', '', maxIos.fromObject, maxIos.toObject)
        .bind('androidMin', '', minAnd.fromObject, minAnd.toObject)
        .bind('androidMax', '', maxAnd.fromObject, maxAnd.toObject)
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
                .bind('type', def.type)
                .bind('unboundedText', def.unboundedText)
                .bind('maxLength', def.maxLength)
                .bind('fileExtension', def.fileExtension)
                .bind('mimeType', def.mimeType);
            return def;
        });
    }
    function fieldObsToDef(fieldDefinitions) {
        var fields = [];
        fieldDefinitions.forEach(function(item) {
            var type = item.typeObs();
            if (!type) {
                return;
            }
            var field = {
                name: item.nameObs(),
                required: item.requiredObs(),
                type: type
            };
            if (type === "string" || type === "inline_json_blob") {
                field.unboundedText = item.unboundedTextObs();
                if (!field.unboundedText) {
                    field.maxLength = item.maxLengthObs();
                }
            } else if (type === "attachment_v2") {
                field.mimeType = item.mimeTypeObs();
                var ext = item.fileExtensionObs();
                if (!/^\./.test(ext)) {
                    ext = "." + ext;
                }
                field.fileExtension = ext;
            }
            fields.push(field);
        });
        return fields;
    }
    function makeNewField() {
        return fieldDefToObs([Object.assign({}, FIELD_SKELETON)])[0];
    }    
    function hideWarning() {
        self.showErrorObs(false);
    }
    function updateRevision(response) {
        self.revisionObs(response.revision);
        self.schema.version = response.version;
        self.isNewObs(false);
        return response;
    }
    function handleError(failureHandler) {
        return function(response) {
            var json = response.responseJSON;
            if (/Can\'t\supdate/.test(json.message)) {
                // This is a schema version mismatch
                self.showErrorObs(true);
                utils.clearPendingControl();
                scrollTo(0);
            } else {
                json.errors = json.errors || [];
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
                .catch(handleError(utils.failureHandler(vm, event)));
        } else {
            // Try and save. If it fails, offer the opportunity to the user to create a new revision.
            serverService.updateUploadSchema(self.schema)
                .then(updateRevision)
                .then(utils.successHandler(vm, event, "Schema has been saved."))
                .catch(handleError(utils.failureHandler(vm, event)));
        }
    };

    self.addBelow = function(field, event) {
        var index = self.fieldDefinitionsObs.indexOf(field);
        var newField = makeNewField();
        self.fieldDefinitionsObs.splice(index+1,0,newField);
    };
    self.addFirst = function(vm, event) {
        var field = makeNewField();
        self.fieldDefinitionsObs.push(field);
    };
    self.saveNewRevision = function(vm, event) {
        utils.startHandler(vm, event);
        // Get the most recent revision, then increment that by one.
        serverService.getMostRecentUploadSchema(params.schemaId).then(function(schema) {
            self.schema.revision = schema.revision + 1;
            delete self.schema.version;
            return self.schema;
        }).then(serverService.createUploadSchema)
            .then(updateRevision)
            .then(utils.successHandler(vm, event, "Schema has been saved at new revision."))
            .then(hideWarning)
            .catch(utils.failureHandler(vm, event));
    };
    self.closeWarning = hideWarning;

    var promise = null;
    if (params.schemaId === "new") {
        promise = Promise.resolve({name:'',schemaId:'',schemaType:'ios_data',revision:null,
            fieldDefinitions:[Object.assign({}, FIELD_SKELETON)]
        });
    } else if (params.revision) {
        promise = serverService.getUploadSchema(params.schemaId, params.revision);
    } else {
        promise = serverService.getMostRecentUploadSchema(params.schemaId);
    }
    promise.then(binder.assign('schema'))
        .then(binder.update())
        .catch(utils.notFoundHandler("Upload schema", "schemas"));
};
