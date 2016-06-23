var utils = require('../../utils');
var serverService = require('../../services/server_service');
var Promise = require('bluebird');
var root = require('../../root');
var bind = require('../../binder');
var alerts = require('../../widgets/alerts');

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('userId', params.userId)
        .obs('consentHistory[]')
        .obs('isNew', false)
        .obs('noConsent', true)
        .obs('title', params.name);

    self.resendConsent = function(vm, event) {
        var subpopGuid = vm.consentURL.split("/subpopulations/")[1].split("/consents/")[0];
        alerts.confirmation("This will send email to this user.\n\nDo you wish to continue?", function() {
            utils.startHandler(vm, event);
            serverService.resendConsentAgreement(params.userId, subpopGuid)
                .then(utils.successHandler(vm, event, "Resent consent agreement."))
                .catch(utils.failureHandler(vm, event));
        });
    };
    self.withdraw = function(vm, event) {
        alerts.deleteConfirmation("This person will have to go through the whole consent process again before submitting more data.\n\n "+
            "After you do this, you should also sign the user out of the app (under the General tab).", function() {
            utils.startHandler(vm, event);
            serverService.withdrawParticipantFromStudy(params.userId)
                .then(load)
                .then(utils.successHandler(vm, event, "User has been withdrawn from the study."))
                .catch(utils.failureHandler(vm, event));
        }, "Withdraw");
    };

    // I know, ridiculous...
    function load() {
        self.consentHistoryObs([]);
        serverService.getParticipant(self.userIdObs()).then(function(response) {
            var histories = response.consentHistories;
            
            return Promise.map(Object.keys(histories), function(guid) {
                return serverService.getSubpopulation(guid);
            }).then(function(subpopulations) {
                subpopulations.forEach(function(subpop) {
                    if (histories[subpop.guid].length === 0) {
                        self.consentHistoryObs.push({
                            consentGroupName: subpop.name,
                            name: "No consent",
                            consented: false
                        });
                    }
                    histories[subpop.guid].reverse().map(function(record, i) {
                        var history = {consented:true, isFirst:(i === 0)};
                        history.consentGroupName = subpop.name;
                        history.consentURL = '/#/subpopulations/'+subpop.guid+'/consents/'+record.consentCreatedOn;
                        history.name = record.name;
                        history.birthdate = new Date(record.birthdate).toLocaleDateString(); 
                        history.signedOn = new Date(record.signedOn).toLocaleString();
                        history.consentCreatedOn = new Date(record.consentCreatedOn).toLocaleString();
                        history.hasSignedActiveConsent = record.hasSignedActiveConsent;
                        if (record.withdrewOn) {
                            history.withdrewOn = new Date(record.withdrewOn).toLocaleString();
                        } else {
                            self.noConsentObs(false);
                        }
                        if (record.imageMimeType && record.imageData) {
                            history.imageData = "data:"+record.imageMimeType+";base64,"+record.imageData;
                        }
                        self.consentHistoryObs.push(history);
                    });
                });
            });
        }).catch(utils.failureHandler());
    }
    load();
};