import 'knockout-postbox';
import {serverService} from '../../services/server_service';
import alerts from '../../widgets/alerts';
import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import tables from '../../tables';
import utils from '../../utils';

const cssClassNameForStatus = {
    'disabled': 'negative',
    'unverified': 'warning',
    'verified': ''
};

function deleteItem(participant) {
    return serverService.deleteParticipant(participant.id);
}
function getId(id) {
    return serverService.getParticipant(id);
}
function getHealthCode(id) {
    return serverService.getParticipant("healthCode:"+id);
}
function getExternalId(id) {
    return serverService.getParticipant("externalId:"+id);
}
function getEmail(id) {
    return serverService.getParticipants(0, 5, id).then(function(response) {
        return (response.items.length === 1) ?
            serverService.getParticipant(response.items[0].id) :
            Promise.reject("Participant not found");
    });
}
function makeSuccess(vm, event) {
    return function(response) {
        event.target.parentNode.parentNode.classList.remove("loading");
        document.location = '#/participants/'+response.id+'/general';
    };
}

module.exports = function() {
    let self = this;
        
    self.total = 0;
    self.emailFilter = null;
    self.phoneFilter = null;
    self.startTime = null;
    self.endTime = null;

    tables.prepareTable(self, {
        name: "participant", 
        delete: deleteItem
    });

    self.isAdmin = root.isAdmin;
    self.recordsObs = ko.observable("");
    self.findObs = ko.observable("");
    fn.copyProps(self, fn, 'formatName', 'formatDateTime', 'formatNameAsFullLabel');

    self.formatEmailPhone = function(value) {
        return (value) ? value : '—';
    };
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
        response.items = response.items.map(function(item) {
            if (item.phone) {
                item.phone = fn.flagForRegionCode(item.phone.regionCode) + ' ' + item.phone.nationalFormat;
            } else {
                item.phone = "";
            }
            return item;
        });
        self.recordsObs(formatCount(response.total));
        self.itemsObs(response.items);
        if (response.items.length === 0) {
            self.recordsMessageObs("There are no user accounts, or none that match the filter.");
        }
        return response;
    }

    self.doSearch = function(event) {
        event.target.parentNode.parentNode.classList.add("loading");

        let id = self.findObs();
        let success = makeSuccess(self, event);
        utils.startHandler(self, event);
        
        getHealthCode(id).then(success).catch(function() {
            getExternalId(id).then(success).catch(function() {
                getId(id).then(success).catch(function() {
                    getEmail(id).then(success)
                        .catch(function(e) {
                            event.target.parentNode.parentNode.classList.remove("loading");
                            utils.failureHandler({transient:false})(e);
                        });
                });
            });
        });
    };

    self.resendEmailVerification = function(vm, event) {
        alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", function() {
            let userId = vm.id;
            utils.startHandler(vm, event);
            serverService.resendEmailVerification(userId)
                .then(utils.successHandler(vm, event, "Resent email to verify participant's email address."))
                .catch(utils.failureHandler());
        });
    };
    self.enableAccount = function(item, event) {
        utils.startHandler(item, event);
        serverService.getParticipant(item.id)
            .then(updateParticipantStatus)
            .then(publishPageUpdate)
            .then(utils.successHandler(item, event, "User account activated."))
            .catch(utils.failureHandler());
    };
    self.exportDialog = function() {
        root.openDialog('participant_export', {emailFilter: self.emailFilter, phoneFilter: self.phoneFilter,
            startTime: self.startTime, endTime: self.endTime, total: self.total});
    };
    self.loadingFunc = function(offsetBy, pageSize, emailFilter, phoneFilter, startTime, endTime) {
        self.emailFilter = emailFilter;
        self.phoneFilter = phoneFilter;
        self.startTime = startTime;
        self.endTime = endTime;

        return serverService.getParticipants(offsetBy, pageSize, emailFilter, phoneFilter, startTime, endTime)
            .then(load)
            .catch(utils.failureHandler());
    };
};