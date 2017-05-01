var serverService = require('./services/server_service');
var fn = require('./transforms');

var surveyNameMap = {};
var schemaNameMap = {};

function updateSurveyNameMap(response) {
    response.items.forEach(function(survey) {
        surveyNameMap[survey.guid] = survey.name;
    });
}
function updateSchemaNameMap(response) {
    response.items.forEach(function(schema) {
        schemaNameMap[schema.schemaId] = schema.name;
    });
}
function loadMaps() {
    return serverService.getPublishedSurveys()
        .then(updateSurveyNameMap)
        .then(serverService.getAllUploadSchemas)
        .then(updateSchemaNameMap);
}
function formatDescription(metadata) {
    var array = [];
    if (metadata.surveyGuid) {
        array.push("Survey: " + surveyNameMap[metadata.surveyGuid]);
    }
    if (metadata.schemaId) {
        array.push("Schema: " + schemaNameMap[metadata.schemaId]);
    }
    if (metadata.licenseRestricted) {
        array.push("some licensing restrictions (see notes)");
    }
    if (metadata.os) {
        array.push(metadata.os + " only");
    }
    return array.join("; ");
}
function formatTags(metadata) {
    return metadata.tags.join(", ");
}
function formatVersions(metadata) {
    var array = ["v." + metadata.version];
    if (metadata.schemaRevision) {
        array.push(" schema v." + metadata.schemaRevision);
    } else if (metadata.surveyCreatedOn) {
        array.push(" survey created on " + fn.formatLocalDateTime(metadata.surveyCreatedOn));
    }
    return array.join(', ');
}
function formatMetadataLinkedItem(metadata) {
    if (metadata.surveyGuid) {
        return "Survey: " + surveyNameMap[metadata.surveyGuid];
    } else if (metadata.schemaId) {
        return "Schema: " + schemaNameMap[metadata.schemaId];
    }
    return "&lt;None&gt;";
}
function getSurveyName(guid) {
    return surveyNameMap[guid];
}
function getSchemaName(id) {
    return schemaNameMap[id];
}

module.exports = {
    loadNameMaps: loadMaps,
    formatDescription: formatDescription,
    formatMetadataLinkedItem: formatMetadataLinkedItem,
    formatTags: formatTags,
    formatVersions: formatVersions,
    getSurveyName: getSurveyName,
    getSchemaName: getSurveyName
};

