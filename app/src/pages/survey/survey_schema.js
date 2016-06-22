var schemaUtils = require('../../pages/schema/schema_utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');
var fn = require('../../transforms');

module.exports = function(params) {
    var self = this;

    schemaUtils.initVM(self);

    bind(self)
        .obs('createdOn', params.createdOn)
        .obs('published', true)
        .obs('survey')
        .obs('guid', params.guid)
        .obs('schema', {})
        .obs('items[]', [])
        .obs('name');

    self.formatDateTime = fn.formatLocalDateTime;

    function loadSchema(survey) {
        self.nameObs(survey.name);
        serverService.getUploadSchema(survey.identifier, survey.schemaRevision).then(function(schema) {
            self.schemaObs(schema);
            self.itemsObs.pushAll(schema.fieldDefinitions);
        }).catch(function(response) {
            if (response.status === 404) {
                document.querySelector(".loading_status").textContent = "The schema for this survey version cannot be found. It may have been deleted.";
            }
        });
    }

    if (params.createdOn) {
        serverService.getSurvey(params.guid, params.createdOn).then(loadSchema);
    } else {
        serverService.getSurveyMostRecent(params.guid).then(loadSchema);
    }
};