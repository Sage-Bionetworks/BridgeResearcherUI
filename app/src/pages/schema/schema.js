import alerts from '../../widgets/alerts';
import Binder from '../../binder';
import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import * as schemaUtils from './schema_utils';
import serverService from '../../services/server_service';
import utils from '../../utils';

var failureHandler = utils.failureHandler({
    redirectTo: "schemas",
    redirectMsg: "Upload schema not found.",
    transient: false
});

module.exports = function(params) {
    var self = this;
    self.schema = {};

    var minIos = Binder.objPropDelegates('minAppVersions', 'iPhone OS');
    var minAnd = Binder.objPropDelegates('minAppVersions', 'Android');
    var maxIos = Binder.objPropDelegates('maxAppVersions', 'iPhone OS');
    var maxAnd = Binder.objPropDelegates('maxAppVersions', 'Android');

    var binder = new Binder(self)
        .obs('isNew', params.schemaId === "new")
        .obs('showError', false)
        .obs('index', 0)
        .obs('title', '&#160;')
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
        .bind('fieldDefinitions[]', [], schemaUtils.fieldDefToObs, schemaUtils.fieldObsToDef);
    schemaUtils.initVM(self);

    var hideWarning = fn.handleStaticObsUpdate(self.showErrorObs, false);
    self.lastRevision = params.revision;
    var updateRevision = fn.seq(
        fn.handleObsUpdate(self.revisionObs, 'revision'),
        fn.handleObsUpdate(self.publishedObs, 'published'),
        fn.handleObsUpdate(self.moduleIdObs, 'moduleId'),
        fn.handleObsUpdate(self.moduleVersionObs, 'moduleVersion'),
        fn.handleCopyProps(self.schema, 'version', 'published'),
        fn.handleCopyProps(self, 'revision->lastRevision'),
        fn.handleConditionalObsUpdate(self.titleObs, 'name'),
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
        // If the schema is published, set flag to false and increment the revision. Will save
        // or throw an error if that revision exists.
        if (self.publishedObs()) {
            self.publishedObs(false);
            self.revisionObs( parseInt(self.revisionObs())+1);
        }
        self.schema = binder.persist(self.schema);
        uploadSchema()
            .then(updateRevision)
            .then(utils.successHandler(vm, event, "Schema has been saved."))
            .catch(failureHandler);
    };
    self.addBelow = function(field, event) {
        var index = self.fieldDefinitionsObs.indexOf(field);
        var newField = schemaUtils.makeNewField();
        self.fieldDefinitionsObs.splice(index+1,0,newField);
    };
    self.addFirst = function(vm, event) {
        var field = schemaUtils.makeNewField();
        self.fieldDefinitionsObs.push(field);
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

    function loadSchema() { 
        if (params.schemaId === "new") {
            self.titleObs("New Upload Schema");
            return Promise.resolve(schemaUtils.makeNewField());
        } else if (params.revision) {
            return serverService.getUploadSchema(params.schemaId, params.revision);
        } else {
            return serverService.getMostRecentUploadSchema(params.schemaId);
        }
    }
    
    loadSchema().then(binder.assign('schema'))
        .then(binder.update())
        .then(fn.handleConditionalObsUpdate(self.titleObs, 'name'))
        .catch(failureHandler);
};
