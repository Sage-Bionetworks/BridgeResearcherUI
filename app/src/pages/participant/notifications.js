import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import root from '../../root';
import tables from '../../tables';
import utils from '../../utils';

module.exports = function(params) {
    let self = this;

    new Binder(self)
        .obs('isNew', false)
        .obs('name', '')
        .obs('userId', params.userId)
        .obs('title', '&#160;')
        .obs('isRegistered', false)
        .obs('status')
        .obs('notificationsEnabled', false)
        .obs('items[]');

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(part.name);
        self.nameObs(part.name);
        self.statusObs(part.status);
    }).catch(utils.failureHandler());

    tables.prepareTable(self, {name:'notification registration'});

    self.isDeveloper = root.isDeveloper;
    self.isResearcher = root.isResearcher;
    self.notificationsEnabledObs = root.notificationsEnabledObs;
    self.formatDate = fn.formatDateTime;

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