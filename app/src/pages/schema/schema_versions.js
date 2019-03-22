import { serverService } from "../../services/server_service";
import Binder from "../../binder";
import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import root from "../../root";
import sharedModuleUtils from "../../shared_module_utils";
import tables from "../../tables";
import utils from "../../utils";

const notFound = utils.failureHandler({
  redirectTo: "schemas",
  redirectMsg: "Schema not found."
});

module.exports = function(params) {
  let self = this;

  new Binder(self)
    .obs("name", "&#160;")
    .obs("published")
    .obs("moduleId")
    .obs("isNew", false)
    .obs("moduleVersion")
    .obs("revision", params.revision)
    .obs("schemaId", params.schemaId);

  tables.prepareTable(self, {
    name: "schema revision",
    type: "UploadSchema",
    refresh: load,
    delete: function(item) {
      return serverService.deleteSchemaRevision(item, false);
    },
    deletePermanently: function(item) {
      return serverService.deleteSchemaRevision(item, true);
    },
    undelete: function(item) {
      return serverService.updateUploadSchema(item);
    }
  });

  fn.copyProps(self, criteriaUtils, "label->criteriaLabel");
  fn.copyProps(self, sharedModuleUtils, "formatModuleLink", "moduleHTML");
  fn.copyProps(self, root, "isAdmin", "isDeveloper");

  function markSchemaPublished(schema) {
    schema.published = true;
    return schema;
  }
  function getUploadSchema() {
    return serverService.getUploadSchema(params.schemaId, params.revision);
  }
  function getUploadSchemaAllRevisions() {
    return serverService.getUploadSchemaAllRevisions(params.schemaId, self.showDeletedObs());
  }
  // similar to tabset
  self.link = function(item) {
    return "#/schemas/" + encodeURIComponent(item.schemaId) + "/versions/" + item.revision + "/editor";
  };
  self.publish = function(item) {
    utils.startHandler(item, event);

    serverService
      .getUploadSchema(item.schemaId, item.revision)
      .then(markSchemaPublished)
      .then(serverService.updateUploadSchema.bind(serverService))
      .then(load)
      .then(utils.successHandler(item, event, "Schema published."))
      .catch(utils.failureHandler());
  };

  function load() {
    sharedModuleUtils
      .loadNameMaps()
      .then(getUploadSchema)
      .then(fn.handleObsUpdate(self.nameObs, "name"))
      .then(fn.handleObsUpdate(self.moduleIdObs, "moduleId"))
      .then(fn.handleObsUpdate(self.moduleVersionObs, "moduleVersion"))
      .then(fn.handleObsUpdate(self.publishedObs, "published"))
      .then(getUploadSchemaAllRevisions)
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(notFound);
  }
  load();
};
