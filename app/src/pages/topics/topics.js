import * as fn from '../../functions';
import root from '../../root';
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

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
