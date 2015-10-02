var ko = require('knockout');
var utils = require('../../utils');
var schemaUtils = require('../../pages/schema/schema_utils');
var serverService = require('../../services/server_service');
var root = require('../../root');

module.exports = function(params) {
    var self = this;

    schemaUtils.initVM(self);

    self.formatDateTime = utils.formatDateTime;
    self.guidObs = ko.observable(params.guid);
    self.createdOnObs = ko.observable(params.createdOn);
    self.publishedObs = ko.observable(true);
    self.surveyObs = ko.observable();
    self.schemaObs = ko.observable({});
    self.itemsObs = ko.observableArray([]);
    self.nameObs = ko.observable();

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