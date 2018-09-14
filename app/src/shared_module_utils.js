import {serverService} from './services/server_service';
import fn from './functions';

const sharedModuleNameMap = {};
const sharedModuleHTMLMap = {};
const surveyNameMap = {};
const schemaNameMap = {};
const objImported = {};

function updateSharedModuleNameMap(response) {
    response.items.forEach(function(metadata) {
        objImported[metadata.id+"/"+metadata.version] = true;
        sharedModuleNameMap[metadata.id] = metadata.name;
        let str = "<p><b>"+metadata.name+"</b></p>";
        str += "<p><i>"+formatDescription(metadata, true)+"</i></p>";
        sharedModuleHTMLMap[metadata.id] = str+metadata.notes;
    });
}
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
function loadNameMaps() {
    return serverService.getMetadata({mostrecent:true, published:true})
        .then(updateSharedModuleNameMap)
        .then(serverService.getSurveys.bind(serverService))
        .then(updateSurveyNameMap)
        .then(serverService.getAllUploadSchemas.bind(serverService))
        .then(updateSchemaNameMap);
}
function formatDescription(metadata, withVersion) {
    let array = [];
    if (metadata.os) {
        array.push(metadata.os + " only");
    }
    if (metadata.surveyGuid && surveyNameMap[metadata.surveyGuid]) {
        array.push("Survey: " + surveyNameMap[metadata.surveyGuid] + 
            " pub. " + fn.formatDateTime(metadata.surveyCreatedOn));
    }
    if (metadata.schemaId && schemaNameMap[metadata.schemaId]) {
        array.push("Schema: " + schemaNameMap[metadata.schemaId] + " v. " + metadata.schemaRevision);
    }
    if (metadata.licenseRestricted) {
        array.push("some licensing restrictions");
    }
    if (withVersion) {
        array.push("v"+metadata.version);
    }
    return (array.length) ? (array.join("; ") + ".") : "";
}
function formatTags(metadata) {
    return (metadata.tags) ? metadata.tags.join(", ") : "";
}
function formatVersions(metadata) {
    return "v " + metadata.version;
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
function formatModuleLink(object) {
    if (object.moduleId) {
        return sharedModuleNameMap[object.moduleId];
    }
    return "";
}
function moduleHTML(object) {
    return sharedModuleHTMLMap[object.moduleId];
}

export default {
    loadNameMaps: loadNameMaps,
    formatDescription,
    formatMetadataLinkedItem,
    formatTags,
    formatVersions,
    getSurveyName,
    getSchemaName,
    formatModuleLink,
    moduleHTML
};

