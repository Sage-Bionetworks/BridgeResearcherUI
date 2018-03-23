import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import root from '../../root';
import utils from '../../utils';

module.exports = function(params) {
    let self = this;

    let binder = new Binder(self)
        .obs('isNew', params.guid === "new")
        .obs('title', 'New Topic')
        .obs('createdOn', '', fn.formatDateTime)
        .obs('modifiedOn', '', fn.formatDateTime)
        .bind('name', '')
        .bind('guid', '')
        .bind('description', '');

    function updateTopic(response) {
        self.titleObs(self.topic.name);
        self.isNewObs(false);
        self.guidObs(response.guid);
        let d = fn.formatDateTime(new Date());
        if (!self.createdOnObs()) { // Just fake this
            self.createdOnObs(d);
        }
        self.modifiedOnObs(d);
        return response;
    }

    fn.copyProps(self, root, 'isDeveloper', 'isResearcher');
    
    self.sendNotification = function(vm, event) {
        root.openDialog('send_notification', {topicId: self.guidObs()});
    };

    function saveTopic(topic) {
        return self.isNewObs() ?
            serverService.createTopic(topic) :
            serverService.updateTopic(topic);
    }

    self.save = function(vm, event) {
        self.topic = binder.persist(self.topic);

        utils.startHandler(vm, event);
        saveTopic(self.topic).then(updateTopic)
            .then(utils.successHandler(vm, event, "Topic has been saved."))
            .catch(utils.failureHandler());
    };
    if (params.guid !== "new") {
        serverService.getTopic(params.guid)
            .then(fn.handleObsUpdate(self.titleObs, 'name'))
            .then(binder.assign('topic'))
            .then(binder.update())
            .catch(utils.failureHandler({
                redirectTo: "topics",
                redirectMsg: "Push notification topic not found."
            }));
    } else {
        self.topic = {guid:'', name:'', description: ''};
    }
};
