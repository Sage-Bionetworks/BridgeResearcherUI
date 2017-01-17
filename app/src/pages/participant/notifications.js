var serverService = require('../../services/server_service');
var bind = require('../../binder');
var root = require('../../root');
var utils = require('../../utils');
var tables = require('../../tables');
var fn = require('../../transforms');

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('isNew', false)
        .obs('name', '')
        .obs('userId', params.userId)
        .obs('title', '&#160;')
        .obs('isRegistered', false)
        .obs('notificationsEnabled', false)
        .obs('items[]');

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
        self.nameObs(root.isPublicObs() ? part.name : part.externalId);
    }).catch(utils.failureHandler());

    tables.prepareTable(self, {name:'notification registration'});

    self.isPublicObs = root.isPublicObs;
    self.isDeveloper = root.isDeveloper;
    self.isResearcher = root.isResearcher;
    self.notificationsEnabledObs = root.notificationsEnabledObs;
    self.formatDate = fn.formatLocalDateTimeWithoutZone;

    self.sendNotification = function() {
        root.openDialog('send_notification', {
            userId: params.userId
        });
    };

    function load() {
        serverService.getParticipantNotifications(params.userId).then(function(response) {
            self.isRegisteredObs(response.items.length > 0);
            self.itemsObs(response.items);
        }).catch(utils.failureHandler());
    }
    load();
};