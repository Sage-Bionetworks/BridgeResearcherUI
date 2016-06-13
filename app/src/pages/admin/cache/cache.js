var utils = require('../../../utils');
var serverService = require('../../../services/server_service');
var tables = require('../../../tables');

function mapKey(cacheKey) {
    return {key: cacheKey};
}

module.exports = function() {
    var self = this;
    
    tables.prepareTable(self, 'cache key', '#/cache', function(item) {
        return serverService.deleteCacheKey(item.key); 
    });

    serverService.getCacheKeys().then(function(response) {
        var items = response.map(mapKey);
        if (items.length) {
            self.itemsObs(items.sort(utils.makeFieldSorter("key")));
        }
    });
};