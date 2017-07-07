import alerts from '../../widgets/alerts';
import Binder from '../../binder';
import config from '../../config';
import serverService from '../../services/server_service';
import sharedModuleUtils from '../../shared_module_utils';
import tables from '../../tables';
import utils from '../../utils';

var DELETE_MSG = "Are you sure you want to delete this shared module version?";

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

    var binder = new Binder(self)
        .obs('published')
        .obs('name')
        .obs('isNew')
        .obs('id')
        .obs('version');

    self.formatDescription = sharedModuleUtils.formatDescription;
    self.formatTags = sharedModuleUtils.formatTags;
    self.formatVersions = sharedModuleUtils.formatVersions;

    self.publishItem = function(item, event) {
        alerts.confirmation(config.msgs.shared_modules.PUBLISH, function() {
            utils.startHandler(self, event);
            item.published = true;
            serverService.updateMetadata(item)
                .then(load)
                .then(utils.successHandler(self, event, "Shared module published."))
                .catch(utils.failureHandler());
        });
    };
    self.deleteItem = function(item, event) {
        alerts.deleteConfirmation(DELETE_MSG, function() {
            utils.startHandler(self, event);
            serverService.deleteMetadataVersion(item.id, item.version)
                .then(load)
                .then(utils.successHandler(self, event, "Shared module version deleted."))
                .catch(utils.failureHandler());
        });
    };

    function load() {
        return serverService.getMetadataVersion(params.id, params.version)
            .then(binder.update())
            .then(binder.assign('metadata'))
            .then(sharedModuleUtils.loadNameMaps)
            .then(function() {
                return serverService.getMetadataAllVersions(params.id);
            }).then(function(response) {
                self.itemsObs(response.items.reverse());
                return response;
            })
            .catch(utils.failureHandler({
                redirectTo: "shared_modules",
                redirectMsg: "Shared module not found"
            }));
    }
    load();
};
