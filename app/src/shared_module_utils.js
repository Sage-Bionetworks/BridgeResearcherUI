import fn from "./functions";
import serverService from "./services/server_service";

const surveyNameMap = {};
const schemaNameMap = {};
const fileNameMap = {};

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
function updateFileNameMap(response) {
  response.items.forEach(function(file) {
    fileNameMap[file.guid] = file.name;
  });
}
function loadNameMaps() {
  return serverService.getSurveys()
    .then(updateSurveyNameMap)
    .then(serverService.getAllUploadSchemas.bind(serverService))
    .then(updateSchemaNameMap)
    .then(serverService.getFiles.bind(serverService))
    .then(updateFileNameMap);
}
function formatDescription(metadata, withVersion) {
  let array = [];
  if (metadata.os) {
    array.push(metadata.os + " only");
  }
  if (metadata.surveyGuid && surveyNameMap[metadata.surveyGuid]) {
    array.push(
      "Survey: " + surveyNameMap[metadata.surveyGuid] + " pub. " + fn.formatDateTime(metadata.surveyCreatedOn)
    );
  }
  if (metadata.schemaId && schemaNameMap[metadata.schemaId]) {
    array.push("Schema: " + schemaNameMap[metadata.schemaId] + " v. " + metadata.schemaRevision);
  }
  if (metadata.licenseRestricted) {
    array.push("some licensing restrictions");
  }
  if (withVersion) {
    array.push("v" + metadata.version);
  }
  return array.length ? array.join("; ") + "." : "";
}
function formatTags(metadata) {
  return metadata.tags ? metadata.tags.join(", ") : "";
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
function getFileName(guid) {
  return fileNameMap[guid];
}

export default {
  loadNameMaps,
  formatDescription,
  formatMetadataLinkedItem,
  formatTags,
  formatVersions,
  getSurveyName,
  getSchemaName,
  getFileName
};
