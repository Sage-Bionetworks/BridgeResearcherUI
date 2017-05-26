var ko = require('knockout');
require('knockout-postbox');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');
var tables = require('../../tables');
var fn = require('../../functions');
var alerts = require('../../widgets/alerts');

var cssClassNameForStatus = {
    'disabled': 'negative',
    'unverified': 'warning',
    'verified': ''
};

function deleteItem(participant) {
    return serverService.deleteParticipant(participant.id);
}

module.exports = function() {
    var self = this;
        
    self.total = 0;
    self.emailFilter = null;
    self.startDate = null;
    self.endDate = null;

    tables.prepareTable(self, {
        name: "participant", 
        delete: deleteItem
    });

    self.isAdmin = root.isAdmin;
    self.recordsObs = ko.observable("");
    self.formatName = fn.formatName;
    self.formatDateTime = fn.formatDateTime;
    self.classNameForStatus = function(user) {
        return cssClassNameForStatus[user.status];
    };
    self.fullName = function(user) {
        return encodeURIComponent(fn.formatName(user));
    };
    
    function formatCount(total) {
        return (total+"").replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " user records";
    }
    function updateParticipantStatus(participant) {
        participant.status = "enabled";
        return serverService.updateParticipant(participant);
    }
    function publishPageUpdate(response) {
        ko.postbox.publish('participants-page-refresh');
        return response;
    }
    function load(response) {
        self.total = response.total;
        self.recordsObs(formatCount(response.total));
        self.itemsObs(response.items);
        if (response.items.length === 0) {
            self.recordsMessageObs("There are no user accounts, or none that match the filter.");
        }
        return response;
    }
    self.resendEmailVerification = function(vm, event) {
        alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", function() {
            var userId = vm.id;
            utils.startHandler(vm, event);
            serverService.resendEmailVerification(userId)
                .then(utils.successHandler(vm, event, "Resent email to verify participant's email address."))
                .catch(utils.failureHandler(vm, event));
        });
    };
    self.enableAccount = function(item, event) {
        utils.startHandler(item, event);
        serverService.getParticipant(item.id)
            .then(updateParticipantStatus)
            .then(publishPageUpdate)
            .then(utils.successHandler(item, event, "User account activated."))
            .catch(utils.failureHandler(item, event));
    };
    self.exportDialog = function() {
        root.openDialog('participant_export', {emailFilter: self.emailFilter, 
            startDate: self.startDate, endDate: self.endDate, total: self.total});    
    };
    self.loadingFunc = function(offsetBy, pageSize, emailFilter, startDate, endDate) {
        self.emailFilter = emailFilter;
        self.startDate = startDate;
        self.endDate = endDate;

        return serverService.getParticipants(offsetBy, pageSize, emailFilter, startDate, endDate)
            .then(load)
            .catch(utils.failureHandler());
    };
};