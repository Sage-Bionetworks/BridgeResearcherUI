var sharedModuleUtils = require('../../shared_module_utils');
var bind = require('../../binder');
var tables = require('../../tables');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

var surveyNameMap = {};
var schemaNameMap = {};

function deleteItem(item) {
    return serverService.deleteMetadataVersion(item.id, item.version);
}

module.exports = function(params) {
    var self = this;
    self.metadata = {};

    tables.prepareTable(self, {
        name: 'shared module version',
        delete: deleteItem,
        redirect: "#/shared_modules"
    });

    var binder = bind(self)
        .obs('at', params.at)
        .obs('name')
        .obs('isNew')
        .obs('id')
        .obs('version');

    self.formatDescription = sharedModuleUtils.formatDescription(surveyNameMap, schemaNameMap);
    self.formatTags = sharedModuleUtils.formatTags;
    self.formatVersions = sharedModuleUtils.formatVersions;

    serverService.getMetadataVersion(params.id, params.at)
        .then(binder.update())
        .then(binder.assign('metadata'))
        .then(function() {
            return sharedModuleUtils.loadNameMaps(surveyNameMap, schemaNameMap);
        })
        .then(function() {
            return serverService.getMetadataAllVersions(params.id);
        }).then(function(request) {
            self.itemsObs(request.items.reverse());
        }).catch(utils.notFoundHandler('Shared module', 'shared_modules'));
};
