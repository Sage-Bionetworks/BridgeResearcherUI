var serverService = require('../../services/server_service');
var criteriaUtils = require('../../criteria_utils');
var tables = require('../../tables');
var bind = require('../../binder');

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('name')
        .obs('schemaId', params.schemaId);

    tables.prepareTable(self, {
        name: 'schema'
    });

    self.criteriaLabel = criteriaUtils.label;

    self.link = function(item) {
        return "#/schemas/"+encodeURIComponent(item.schemaId)+"/versions/"+item.revision;
    };
    serverService.getUploadSchemaAllRevisions(params.schemaId).then(function(response) {
        self.itemsObs(response.items);
        if (response.items.length) {
            self.nameObs(response.items[0].name);
        }
    });
};