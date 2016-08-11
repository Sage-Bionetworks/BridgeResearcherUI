var utils = require('../../../utils');
var serverService = require('../../../services/server_service');
var tables = require('../../../tables');

function mapKey(cacheKey) {
    return {key: cacheKey};
}

module.exports = function() {
    var self = this;
    
    tables.prepareTable(self, 'cache key', function(item) {
        return serverService.deleteCacheKey(item.key); 
    });

    serverService.getCacheKeys().then(function(response) {
        var items = response.map(mapKey);
        self.itemsObs(items.sort(utils.makeFieldSorter("key")));
    });
};