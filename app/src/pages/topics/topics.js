var serverService = require('../../services/server_service');
var tables = require('../../tables');
var root = require('../../root');

function deleteTopic(topic) {
    return serverService.deleteTopic(topic.guid);
}

module.exports = function() {
    var self = this;

    self.isDeveloper = root.isDeveloper;
    self.notificationsEnabledObs = root.notificationsEnabledObs;
    
    tables.prepareTable(self, {name: 'topic', type: 'NotificationTopic', 
        delete: deleteTopic, refresh: load});

    function load() {
        serverService.getAllTopics().then(function(response) {
            console.log(response.items);
            self.itemsObs(response.items);
        });
    }
    load();
};