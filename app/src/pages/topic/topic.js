var serverService = require('../../services/server_service');
var bind = require('../../binder');
var tx = require('../../transforms');
var utils = require('../../utils');
var root = require('../../root');

module.exports = function(params) {
    var self = this;

    var binder = bind(self)
        .obs('isNew', params.guid === "new")
        .obs('title', 'New Topic')
        .obs('createdOn', '', tx.formatLocalDateTime)
        .obs('modifiedOn', '', tx.formatLocalDateTime)
        .bind('name', '')
        .bind('guid', '')
        .bind('description', '');

    function updateTitle(response) {
        self.titleObs(response.name);
        return response;
    }

    function updateTopic(response) {
        self.titleObs(self.topic.name);
        self.isNewObs(false);
        self.guidObs(response.guid);
        var d = tx.formatLocalDateTime(new Date());
        if (!self.createdOnObs()) { // Just fake this
            self.createdOnObs(d);
        }
        self.modifiedOnObs(d);
        return response;
    }

    self.isDeveloper = root.isDeveloper;
    self.isResearcher = root.isResearcher;
    
    self.sendNotification = function(vm, event) {
        root.openDialog('send_notification', {topicId: self.guidObs()});
    };

    self.save = function(vm, event) {
        utils.startHandler(vm, event);

        self.topic = binder.persist(self.topic);
        var promise = self.isNewObs() ?
            serverService.createTopic(self.topic) :
            serverService.updateTopic(self.topic);
        promise.then(updateTopic)
            .then(utils.successHandler(vm, event, "Topic has been saved."))
            .catch(utils.failureHandler(vm, event));
    };

    if (params.guid !== "new") {
        serverService.getTopic(params.guid)
            .then(updateTitle)
            .then(binder.assign('topic'))
            .then(binder.update());
    } else {
        self.topic = {guid:'', name:'', description: ''};
    }
};
