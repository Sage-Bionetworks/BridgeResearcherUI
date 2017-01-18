var serverService = require('../../services/server_service');
var tables = require('../../tables');
var utils = require('../../utils');
var root = require('../../root');

function deleteTopic(topic) {
    return serverService.deleteTopic(topic.guid);
}

module.exports = function() {
    var self = this;

    self.isDeveloper = root.isDeveloper;
    self.notificationsEnabledObs = root.notificationsEnabledObs;
    
    tables.prepareTable(self, {
        name: 'topic',
        delete: deleteTopic
    });

    utils.startHandler(self);
    serverService.getAllTopics().then(function(response) {
        self.itemsObs(response.items);
    });
};