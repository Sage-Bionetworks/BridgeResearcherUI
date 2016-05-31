var ko = require('knockout');
var utils = require('../../../utils');
var serverService = require('../../../services/server_service');

module.exports = function() {
    var self = this;

    function mapKey(cacheKey) {
        return {key: cacheKey};
    }
    function deleteKey(item) {
        return serverService.deleteCacheKey(item.key);
    }
    
    self.itemsObs = ko.observableArray([]);

    self.atLeastOneChecked = function () {
        return self.itemsObs().some(utils.hasBeenChecked);
    };

    self.deleteCacheKeys = function(vm, event) {
        var deletables = self.itemsObs().filter(utils.hasBeenChecked);
        var msg = (deletables.length > 1) ?
                "Are you sure you want to delete these cached items?" :
                "Are you sure you want to delete this cached item?";
        var confirmMsg = (deletables.length > 1) ?
                "Cache keys deleted." : "Cache key deleted.";

        if (confirm(msg)) {
            utils.startHandler(self, event);
            Promise.all(deletables.map(deleteKey))
                .then(utils.makeTableRowHandler(vm, deletables, "#/cache"))
                .then(utils.successHandler(vm, event, confirmMsg))
                .catch(utils.failureHandler(vm, event));
        }
    };

    serverService.getCacheKeys().then(function(response) {
        var items = response.map(mapKey);
        if (items.length) {
            self.itemsObs(items.sort(utils.makeFieldSorter("key")).map(utils.addCheckedObs));
        } else {
            document.querySelector(".loading_status").textContent = "There are currently no cache keys.";
        }
    });
};