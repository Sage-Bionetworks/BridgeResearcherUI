import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import criteriaUtils from '../../criteria_utils';
import fn from '../../functions';
import jsonFormatter from '../../json_formatter';
import root from '../../root';
import sharedModuleUtils from '../../shared_module_utils';
import Task from '../task/task';
import utils from '../../utils';

var failureHandler = utils.failureHandler({
    redirectMsg:"App config not found.", 
    redirectTo:"appconfigs",
    transient: false
});

function newAppConfig() {
    return {
        'label': '',
        'clientData': {},
        'criteria': criteriaUtils.newCriteria(),
        'surveyReferences': [],
        'schemaReferences': []
    };
}

module.exports = function(params) {
    var self = this;

    var binder = new Binder(self)
        .obs('isNew', params.guid === "new")
        .obs('title', 'New App Config')
        .obs('guid')
        .obs('createdOn')
        .obs('modifiedOn')
        .obs('schemaIndex')
        .obs('surveyIndex')
        .bind('version')
        .bind('label')
        .bind('criteria')
        .bind('clientData', null, Binder.fromJson, Binder.toJson)
        .bind('surveyReferences[]', [], Task.surveyListToView, Task.surveyListToTask)
        .bind('schemaReferences[]', [], Task.schemaListToView, Task.schemaListToTask);

    var titleUpdated = fn.handleObsUpdate(self.titleObs, 'label');
    fn.copyProps(self, fn, 'formatDateTime');

    function saveAppConfig() {
        return (self.appConfig.guid) ?
            serverService.updateAppConfig(self.appConfig) :
            serverService.createAppConfig(self.appConfig);
    }
    function updateModifiedOn(response) {
        self.modifiedOnObs(new Date().toISOString());
        return response;
    }
    function load() {
        if (params.guid === "new") {
            return Promise.resolve(newAppConfig())
                .then(binder.assign('appConfig'))
                .then(binder.update());
        } else {
            return serverService.getAppConfig(params.guid)
                .then(binder.assign('appConfig'))
                .then(binder.update())
                .then(titleUpdated);
        }
    }
    function updateClientData() {
        if (self.clientDataObs()) {
            try {
                var json = JSON.parse(self.clientDataObs());
                self.clientDataObs(jsonFormatter.prettyPrint(json));
            } catch(e) {
                var error = new BridgeError();
                error.addError("clientData", "is not valid JSON");
                utils.failureHandler({transient:false})(error);
                return true;
            }
        }
        return false;
    }

    self.openSchemaSelector = function(vm, event) {
        self.appConfig = binder.persist(self.appConfig);
        root.openDialog('select_schemas', {
            addSchemas: self.addSchemas.bind(self),
            allowMostRecent: true,
            selected: self.appConfig.schemaReferences
        });
    };
    self.openSurveySelector = function(vm, event) {
        self.task = binder.persist(self.appConfig);
        root.openDialog('select_surveys', {
            addSurveys: self.addSurveys.bind(self),
            allowMostRecent: true,
            selected: self.appConfig.surveyReferences
        });
    };
    self.addSchemas = function(schemas) {
        self.schemaReferencesObs([]);
        for (var i=0; i < schemas.length; i++) {
            var newSchema = Task.schemaToView(schemas[i]);
            this.schemaReferencesObs.push(newSchema);
            Task.loadSchemaRevisions(newSchema);
        }
        root.closeDialog();
    };
    self.addSurveys = function(surveys) {
        self.surveyReferencesObs([]);
        for (var i=0; i < surveys.length; i++) {
            var newSurvey = Task.surveyToView(surveys[i]);
            self.surveyReferencesObs.push(newSurvey);
            Task.loadSurveyRevisions(newSurvey);
        }
        root.closeDialog();
    };
    self.removeSchema = function(object, event) {
        self.schemaReferencesObs.remove(object);
    };
    self.removeSurvey = function(object, event) {
        this.surveyReferencesObs.remove(object);
    };
    self.save = function(vm, event) {
        if (updateClientData()) {
            return;
        }
        self.appConfig = binder.persist(self.appConfig);
        utils.startHandler(vm, event);
        saveAppConfig()
            .then(fn.handleStaticObsUpdate(self.isNewObs, false))
            .then(fn.handleObsUpdate(self.guidObs, 'guid'))
            .then(fn.handleObsUpdate(self.versionObs, 'version'))
            .then(fn.handleCopyProps(params, 'guid'))
            .then(updateModifiedOn)
            .then(fn.returning(self.appConfig))
            .then(titleUpdated)
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