var serverService = require('./services/server_service');
var fn = require('./transforms');

function updateSurveyNameMap(surveyNameMap) {
    return function(response) {
        response.items.forEach(function(survey) {
            surveyNameMap[survey.guid] = survey.name;
        });
        return response;
    };
}
function updateSchemaNameMap(schemaNameMap) {
    return function(response) {
        response.items.forEach(function(schema) {
            schemaNameMap[schema.schemaId] = schema.name;
        });
        return response;
    };
}
function loadMaps(surveyNameMap, schemaNameMap) {
    return serverService.getPublishedSurveys()
        .then(updateSurveyNameMap(surveyNameMap))
        .then(serverService.getAllUploadSchemas)
        .then(updateSchemaNameMap(schemaNameMap));
}
function makeFormatDescription(surveyNameMap, schemaNameMap) {
    return function formatDescription(metadata) {
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
    };
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
module.exports = {
    loadNameMaps: loadMaps,
    formatDescription: makeFormatDescription,
    formatTags: formatTags,
    formatVersions: formatVersions
};

