import { serverService } from "../../services/server_service";
import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";
import sharedModuleUtils from "../../shared_module_utils";
import utils from "../../utils";

const OPTIONS = Object.freeze([
  { value: null, label: "Both" },
  { value: "Android", label: "Android" },
  { value: "iOS", label: "iOS" }
]);
const failureHandler = utils.failureHandler({
  redirectTo: "shared_modules",
  redirectMsg: "Shared module not found."
});

function tagsToView(tags) {
  return (tags || []).join(", ");
}
function tagsToModel(tags) {
  return tags.split(/\s?,\s?/).filter(function(v) {
    return v !== "";
  });
}
function loadSurveyRevisions(vm, survey) {
  return serverService.getSurveyAllRevisions(survey.guid).then(function(response) {
    // Need to confirm, but if you link to unpublished survey, it is just published
    // when you publish the metadata... ?
    let dates = response.items.map(function(oneSurvey) {
      let d = fn.formatDateTime(oneSurvey.createdOn);
      return { value: oneSurvey.createdOn, label: d };
    });
    vm.linkedVersionOptionsObs(dates);
  });
}
function loadSchemaRevisions(vm, schema) {
  let identifier = schema.id || schema.schemaId;
  return serverService.getUploadSchemaAllRevisions(identifier).then(function(response) {
    let revisions = response.items.map(function(oneSchema) {
      return { value: oneSchema.revision, label: oneSchema.revision };
    });
    vm.linkedVersionOptionsObs(revisions);
  });
}
export default function sharedModule(params) {
  let self = this;
  self.editor = null;
  self.metadata = { tags: [], version: 1 };

  let binder = new Binder(self)
    .obs("isNew", params.id === "new")
    .obs("title", "New Shared Module")
    .bind("published", false)
    .bind("id", params.id)
    .bind("licenseRestricted", false)
    .bind("name", "")
    .bind("notes", "", notesToView, notesToModel)
    .bind("os", null)
    .bind("tags", "", tagsToView, tagsToModel)
    .bind("version", 1)
    .bind("schemaId")
    .bind("schemaRevision")
    .obs("schemaVersions[]")
    .obs("linkedName", "&lt;None&gt;")
    .obs("linkedVersion")
    .obs("linkedVersionOptions[]", [])
    .bind("surveyGuid")
    .bind("surveyCreatedOn")
    .obs("surveyVersions[]");

  self.linkedVersionObs.subscribe(function(newValue) {
    if (self.metadata.surveyGuid) {
      self.schemaRevisionObs(null);
      self.surveyCreatedOnObs(newValue);
    } else if (self.metadata.schemaId) {
      self.schemaRevisionObs(newValue);
      self.surveyCreatedOnObs(null);
    }
  });

  function updateId(metadata) {
    params.id = metadata.id;
    self.isNewObs(false);
    self.idObs(metadata.id);
    self.versionObs(metadata.version);
    self.publishedObs(metadata.published);
    self.metadata.id = metadata.id;
    self.metadata.version = metadata.version;
    self.metadata.published = metadata.published;
    return metadata;
  }
  function updateSharedModuleWithNames(metadata) {
    self.linkedNameObs(sharedModuleUtils.formatMetadataLinkedItem(metadata));
    if (metadata.surveyGuid) {
      loadSurveyRevisions(self, { guid: metadata.surveyGuid }).then(function() {
        self.linkedVersionObs(metadata.surveyCreatedOn);
      });
    } else if (metadata.schemaId) {
      loadSchemaRevisions(self, { schemaId: metadata.schemaId }).then(function() {
        // Sometimes this is metadata.revision, and sometimes it's metadata.schemaRevision,
        // which is really a problem...
        self.linkedVersionObs(metadata.schemaRevision);
      });
    } else {
      self.linkedVersionOptionsObs([]);
    }
    return metadata;
  }
  function notesToView(notes, context) {
    // It's a race, whichever loads last (data or editor) does the initialization.
    if (self.editor) {
      self.editor.setData(notes);
    }
  }
  function notesToModel() {
    return self.editor.getData();
  }
  function getSchemaList() {
    return self.metadata.schemaId ? [{ id: self.metadata.schemaId }] : [];
  }
  function getSurveyList() {
    return self.metadata.surveyGuid ? [{ guid: self.metadata.surveyGuid }] : [];
  }
  function loadMetadata() {
    if (params.version) {
      return serverService.getMetadataVersion(params.id, params.version);
    } else {
      return serverService.getMetadataLatestVersion(params.id);
    }
  }
  function updateTitle(metadata) {
    self.titleObs(metadata.name);
    return metadata;
  }

  self.osOptions = OPTIONS;

  self.openSchemaSelector = function() {
    self.metadata = binder.persist(self.metadata);
    root.openDialog("select_schemas", {
      addSchemas: self.addSchemas,
      allowMostRecent: false,
      selected: getSchemaList(),
      selectOne: true
    });
  };
  self.openSurveySelector = function() {
    self.metadata = binder.persist(self.metadata);
    root.openDialog("select_surveys", {
      addSurveys: self.addSurveys,
      allowMostRecent: false,
      selected: getSurveyList(),
      selectOne: true
    });
  };
  self.addSchemas = function(schemas) {
    self.surveyGuidObs(null);
    self.surveyCreatedOnObs(null);
    delete self.metadata.surveyGuid;
    delete self.metadata.surveyCreatedOn;

    let schema = schemas[0];
    self.schemaIdObs(schema.id);
    self.schemaRevisionObs(schema.revision);
    self.linkedNameObs("Schema: " + schema.id);
    loadSchemaRevisions(self, schema).then(function() {
      self.linkedVersionObs(schema.revision);
    });
    root.closeDialog();
  };

  self.addSurveys = function(surveys) {
    self.schemaIdObs(null);
    self.schemaRevisionObs(null);
    delete self.metadata.schemaId;
    delete self.metadata.schemaRevision;

    let survey = surveys[0];
    self.surveyGuidObs(survey.guid);
    self.surveyCreatedOnObs(survey.createdOn);
    self.linkedNameObs("Survey: " + survey.name);
    loadSurveyRevisions(self, survey).then(function() {
      self.linkedVersionObs(survey.createdOn);
    });
    root.closeDialog();
  };
  self.initEditor = function(ckeditor) {
    self.editor = ckeditor;
    self.editor.setData(self.metadata.notes);
  };
  self.save = function(vm, event) {
    let oldVersion = self.metadata.version; // prior to updating from model
    self.metadata = binder.persist(self.metadata);
    let methodName = params.id === "new" || self.metadata.version !== oldVersion ? "createMetadata" : "updateMetadata";
    if (oldVersion !== self.versionObs()) {
      self.metadata.published = false;
    }

    utils.startHandler(vm, event);
    serverService[methodName](self.metadata)
      .then(updateId)
      .then(updateTitle)
      .then(utils.successHandler(vm, event, "Shared module saved."))
      .catch(utils.failureHandler());
  };
  if (params.id !== "new") {
    sharedModuleUtils
      .loadNameMaps()
      .then(loadMetadata)
      .then(updateTitle)
      .then(binder.assign("metadata"))
      .then(binder.update())
      .then(updateSharedModuleWithNames)
      .catch(failureHandler);
  }
};
sharedModule.prototype.dispose = function() {
  if (this.editor) {
    this.editor.destroy();
  }
};
