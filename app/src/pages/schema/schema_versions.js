var serverService = require('../../services/server_service');
var criteriaUtils = require('../../criteria_utils');
var sharedModuleUtils = require('../../shared_module_utils');
var tables = require('../../tables');
var bind = require('../../binder');
var fn = require('../../functions');
var utils = require('../../utils');

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('name')
        .obs('published')
        .obs('moduleId')
        .obs('moduleVersion')
        .obs('revision', params.revision)
        .obs('schemaId', params.schemaId);

    tables.prepareTable(self, {
        name: 'schema'
    });

    fn.copyProps(self, criteriaUtils, 'label->criteriaLabel');
    fn.copyProps(self, sharedModuleUtils, 'formatModuleLink', 'moduleHTML');

    self.revisionLabel = ko.computed(function() {
        if (self.revisionObs()) {
            return 'v' + self.revisionObs();
        }
        return '';
    });
    self.link = function(item) {
        return "#/schemas/"+encodeURIComponent(item.schemaId)+"/versions/"+item.revision+'/editor';
    };
    self.publish = function(item) {
        utils.startHandler(item, event);

        serverService.getUploadSchema(item.schemaId, item.revision)
            .then(function(schema) {
                schema.published = true;
                return schema;
            })
            .then(serverService.updateUploadSchema)
            .then(load)
            .then(utils.successHandler(item, event, "Schema published."))
            .catch(utils.failureHandler());
    };

    function load() {
        sharedModuleUtils.loadNameMaps().then(function() {
            return serverService.getUploadSchema(params.schemaId, params.revision);
        })
            .then(fn.handleObsUpdate(self.moduleIdObs, 'moduleId'))
            .then(fn.handleObsUpdate(self.moduleVersionObs, 'moduleVersion'))
            .then(fn.handleObsUpdate(self.publishedObs, 'published'))
            .then(function(response) {
                return serverService.getUploadSchemaAllRevisions(params.schemaId);
            }).then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .then(function(response) {
                if (response.items.length) {
                    self.nameObs(response.items[0].name);
                }
            });
    }
    load();
};
module.exports.prototype.dispose = function() {
    this.revisionLabel.dispose();
};