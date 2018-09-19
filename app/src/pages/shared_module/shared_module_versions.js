import {serverService} from '../../services/server_service';
import alerts from '../../widgets/alerts';
import Binder from '../../binder';
import config from '../../config';
import fn from '../../functions';
import sharedModuleUtils from '../../shared_module_utils';
import tables from '../../tables';
import utils from '../../utils';

const FAILURE_HANDLER = utils.failureHandler({
    redirectTo: "shared_modules",
    redirectMsg: "Shared module not found"
});

module.exports = function(params) {
    let self = this;
    self.metadata = {};

    tables.prepareTable(self, {
        name: 'shared module version',
        redirect: "#/shared_modules",
        refresh: load,
        delete: function(item) {
            return serverService.deleteMetadataVersion(item.id, item.version, false);
        }, 
        deletePermanently: function(item) {
            return serverService.deleteMetadataVersion(item.id, item.version, true);
        },
        undelete: function(item) {
            return serverService.updateMetadata(item);
        }
    });

    let binder = new Binder(self)
        .obs('published')
        .obs('name')
        .obs('isNew')
        .obs('id', params.id)
        .obs('version', params.version);

    fn.copyProps(self, sharedModuleUtils, 'formatDescription', 'formatTags', 'formatVersions');

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

    function getMetadataAllVersions() {
        return serverService.getMetadataAllVersions(params.id, self.showDeletedObs());
    }

    function load() {
        return serverService.getMetadataVersion(params.id, params.version)
            .then(binder.update())
            .then(binder.assign('metadata'))
            .then(sharedModuleUtils.loadNameMaps)
            .then(getMetadataAllVersions)
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(FAILURE_HANDLER);
    }
    load();
};
