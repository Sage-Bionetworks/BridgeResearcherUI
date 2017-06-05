var serverService = require('../../services/server_service');
var tables = require('../../tables');
var root = require('../../root');
var utils = require('../../utils');
var fn = require('../../functions');

function deleteTopic(topic) {
    return serverService.deleteTopic(topic.guid);
}

module.exports = function() {
    var self = this;

    fn.copyProps(self, root, 'isDeveloper', 'notificationsEnabledObs');
    
    tables.prepareTable(self, {name: 'topic', type: 'NotificationTopic', 
        delete: deleteTopic, refresh: load});

    function load() {
        serverService.getAllTopics()
            .then(fn.handleSort('items','name'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};