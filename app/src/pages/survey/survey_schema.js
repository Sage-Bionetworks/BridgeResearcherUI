import {serverService} from '../../services/server_service';
import * as schemaUtils from '../../pages/schema/schema_utils';
import Binder from '../../binder';
import fn from '../../functions';
import tables from '../../tables';

module.exports = function(params) {
    var self = this;

    schemaUtils.initVM(self);

    new Binder(self)
        .obs('createdOn', params.createdOn)
        .obs('published', false)
        .obs('survey')
        .obs('guid', params.guid)
        .obs('schema', {})
        .obs('items[]', [])
        .obs('name');

    tables.prepareTable(self, {name:'schema'});

    self.formatDateTime = fn.formatDateTime;

    function loadSchema(survey) {
        self.nameObs(survey.name);
        self.publishedObs(survey.published);
        if (survey.published) {
            serverService.getUploadSchema(survey.identifier, survey.schemaRevision)
                .then(function(schema) {
                    self.schemaObs(schema);
                    self.itemsObs.pushAll(schema.fieldDefinitions);
                }).catch(function(response) {
                    if (response.status === 404) {
                        self.recordsMessageObs("The schema for this survey version cannot be found. It may have been deleted.");
                    }
                });
        }
    }

    if (params.createdOn) {
        serverService.getSurvey(params.guid, params.createdOn).then(loadSchema);
    } else {
        serverService.getSurveyMostRecent(params.guid).then(loadSchema);
    }
};