var ko = require('knockout');
var utils = require('../../../utils');
var serverService = require('../../../services/server_service');

module.exports = function() {
    var self = this;

    self.itemsObs = ko.observableArray([]);

    self.atLeastOneChecked = function () {
        return self.itemsObs().some(function(item) {
            return item.checkedObs();
        });
    }

    self.deleteCacheKeys = function(vm, event) {
        var deletables = self.itemsObs().filter(utils.hasBeenChecked);
        var msg = (deletables.length > 1) ?
                "Are you sure you want to delete these cached items?" :
                "Are you sure you want to delete this cached item?";
        var confirmMsg = (deletables.length > 1) ?
                "Cache keys deleted." : "Cache key deleted.";

        if (confirm(msg)) {
            utils.startHandler(self, event);
            var promises = deletables.map(function(item) {
                return serverService.deleteCacheKey(item.key);
            });
            Promise.all(promises)
                .then(utils.makeTableRowHandler(vm, deletables, "#/cache"))
                .then(utils.successHandler(vm, event, confirmMsg))
                .catch(utils.failureHandler(vm, event));
        }
    }

    serverService.getCacheKeys().then(function(response) {
        var items = response.map(function(cacheKey) {
            return {key: cacheKey};
        });
        if (items.length) {
            self.itemsObs(items.sort(utils.makeFieldSorter("key")).map(utils.addCheckedObs));
        } else {
            document.querySelector(".loading_status").textContent = "There are currently no cache keys.";
        }
    });

};