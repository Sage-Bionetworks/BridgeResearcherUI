import { Binder } from '../../binder';
import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import schemaUtils from './schema_utils';
import serverService from '../../services/server_service';
import utils from '../../utils';

var FIELD_SKELETON = {
    name:'', required:false, type:null, unboundedText:false, maxLength:'100', fileExtension:'', mimeType:'',
        multiChoiceAnswerList:[], allowOtherChoices:false
};
var failureHandler = utils.failureHandler({
    redirectTo: "schemas",
    redirectMsg: "Upload schema not found.",
    transient: false
});

module.exports = function(params) {
    var self = this;

    var minIos = bind.objPropDelegates('minAppVersions', 'iPhone OS');
    var minAnd = bind.objPropDelegates('minAppVersions', 'Android');
    var maxIos = bind.objPropDelegates('maxAppVersions', 'iPhone OS');
    var maxAnd = bind.objPropDelegates('maxAppVersions', 'Android');

    var binder = new Binder(self)
        .obs('isNew', params.schemaId === "new")
        .obs('showError', false)
        .obs('index', 0)
        .bind('schemaId', params.schemaId)
        .bind('schemaType')
        .bind('published', false)
        .bind('revision', params.revision ? params.revision : null)
        .bind('name', '')
        .bind('moduleId')
        .bind('moduleVersion')
        .bind('iosMin', '', minIos.fromObject, minIos.toObject)
        .bind('iosMax', '', maxIos.fromObject, maxIos.toObject)
        .bind('androidMin', '', minAnd.fromObject, minAnd.toObject)
        .bind('androidMax', '', maxAnd.fromObject, maxAnd.toObject)
        .bind('fieldDefinitions[]', [], fieldDefToObs, fieldObsToDef);
    schemaUtils.initVM(self);

    var hideWarning = fn.handleStaticObsUpdate(self.showErrorObs, false);
    var updateRevision = fn.seq(
        fn.log('response'),
        fn.handleObsUpdate(self.revisionObs, 'revision'),
        fn.handleObsUpdate(self.publishedObs, 'published'),
        fn.handleObsUpdate(self.moduleIdObs, 'moduleId'),
        fn.handleObsUpdate(self.moduleVersionObs, 'moduleVersion'),
        fn.handleCopyProps(self.schema, 'version', 'published'),
        fn.handleStaticObsUpdate(self.isNewObs, false)
    );
    self.revisionLabel = ko.computed(function() {
        if (self.revisionObs()) {
            return 'v' + self.revisionObs();
        }
        return '';
    });

    function fieldDefToObs(fieldDefinitions) {
        return fieldDefinitions.map(function(def) {
            new Binder(def)
                .bind('name', def.name)
                .bind('required', def.required)
                .bind('type', def.type)
                .bind('unboundedText', def.unboundedText)
                .bind('maxLength', def.maxLength)
                .bind('fileExtension', def.fileExtension)
                .bind('allowOtherChoices', def.allowOtherChoices)
                .bind('multiChoiceAnswerList[]', [].concat(def.multiChoiceAnswerList))
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
            if (type === "string" || type === "inline_json_blob" || type === "single_choice") {
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
            } else if (type === "multi_choice") {
                field.multiChoiceAnswerList = item.multiChoiceAnswerListObs();
                field.allowOtherChoices = item.allowOtherChoicesObs();
            }
            fields.push(field);
        });
        return fields;
    }
    function makeNewField() {
        return fieldDefToObs([Object.assign({}, FIELD_SKELETON)])[0];
    }    
    function uploadSchema() {
        if (self.isNewObs()) {
            return serverService.createUploadSchema(self.schema);
        } else {
            return serverService.updateUploadSchema(self.schema);
        }
    }
    // Get the most recent revision, then increment that by one. Reset version/revision
    // and de-link it from shared modules.
    function reviseToNew(schema) {
        self.schema.revision = schema.revision + 1;
        delete self.schema.published;
        delete self.schema.version;
        delete self.schema.moduleId;
        delete self.schema.moduleVersion;
        return self.schema;
    }

    self.save = function(vm, event) {
        utils.startHandler(vm, event);

        self.schema = binder.persist(self.schema);
        uploadSchema()
            .then(updateRevision)
            .then(utils.successHandler(vm, event, "Schema has been saved."))
            .catch(failureHandler);
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

        self.schema = binder.persist(self.schema);
        serverService.getMostRecentUploadSchema(params.schemaId)
            .then(reviseToNew)
            .then(serverService.createUploadSchema)
            .then(updateRevision)
            .then(hideWarning)
            .then(utils.successHandler(vm, event, "Schema has been saved at new revision."))
            .catch(failureHandler);
    };
    self.editMultiChoiceAnswerList = function(field, event) {
        var otherLists = self.fieldDefinitionsObs().filter(function(oneField) {
            return (oneField.typeObs() === "multi_choice" && oneField.multiChoiceAnswerListObs().length);
        }).map(function(oneField) {
            return [].concat(oneField.multiChoiceAnswerListObs());
        });
        root.openDialog('multichoice_editor', {
            listObs: field.multiChoiceAnswerListObs,
            otherLists: otherLists
        });
    };
    
    self.closeWarning = hideWarning;

    function loadSchema() { 
        if (params.schemaId === "new") {
            return Promise.resolve({name:'',schemaId:'',schemaType:'ios_data',revision:null,
                fieldDefinitions:[Object.assign({}, FIELD_SKELETON)]
            });
        } else if (params.revision) {
            return serverService.getUploadSchema(params.schemaId, params.revision);
        } else {
            return serverService.getMostRecentUploadSchema(params.schemaId);
        }
    }

    loadSchema().then(binder.assign('schema'))
        .then(binder.update())
        .catch(failureHandler);
};
module.exports.prototype.dispose = function() {
    this.revisionLabel.dispose();
};