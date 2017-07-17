import Binder from '../../binder';
import criteriaUtils from '../../criteria_utils';
import fn from '../../functions';
import serverService from '../../services/server_service';
import sharedModuleUtils from '../../shared_module_utils';
import tables from '../../tables';
import utils from '../../utils';

module.exports = function(params) {
    var self = this;

    new Binder(self)
        .obs('name', '&#160;')
        .obs('published')
        .obs('moduleId')
        .obs('isNew', false)
        .obs('moduleVersion')
        .obs('revision', params.revision)
        .obs('schemaId', params.schemaId);

    tables.prepareTable(self, {
        name: 'schema'
    });

    fn.copyProps(self, criteriaUtils, 'label->criteriaLabel');
    fn.copyProps(self, sharedModuleUtils, 'formatModuleLink', 'moduleHTML');

    function markSchemaPublished(schema) {
        schema.published = true;
        return schema;
    }
    function getUploadSchema() {
        return serverService.getUploadSchema(params.schemaId, params.revision);
    }
    function getUploadSchemaAllRevisions() {
        return serverService.getUploadSchemaAllRevisions(params.schemaId);
    }
    function setItemsName(response) {
        if (response.items.length) {
            self.nameObs(response.items[0].name);
        }
    }
    // similar to tabset
    self.link = function(item) {
        return "#/schemas/"+encodeURIComponent(item.schemaId)+"/versions/"+item.revision+'/editor';
    };
    self.publish = function(item) {
        utils.startHandler(item, event);

        serverService.getUploadSchema(item.schemaId, item.revision)
            .then(markSchemaPublished)
            .then(serverService.updateUploadSchema)
            .then(load)
            .then(utils.successHandler(item, event, "Schema published."))
            .catch(utils.failureHandler());
    };

    function load() {
        sharedModuleUtils.loadNameMaps()
            .then(getUploadSchema)
            .then(fn.handleObsUpdate(self.moduleIdObs, 'moduleId'))
            .then(fn.handleObsUpdate(self.moduleVersionObs, 'moduleVersion'))
            .then(fn.handleObsUpdate(self.publishedObs, 'published'))
            .then(getUploadSchemaAllRevisions)
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .then(setItemsName);
    }
    load();
};