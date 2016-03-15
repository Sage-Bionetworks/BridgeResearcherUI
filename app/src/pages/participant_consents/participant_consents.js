var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');
var Promise = require('es6-promise').Promise;

module.exports = function(params) {
    var self = this;

    self.emailObs = ko.observable(decodeURIComponent(params.email));

    self.subpopulationsObs = ko.observableArray([]);

    self.formatSignedOn = function(signedOn) {
        return new Date(signedOn);
    }

    serverService.getParticipant(self.emailObs()).then(function(response) {
        var histories = response.consentHistories;
        
        var requests = Object.keys(histories).map(function(guid) {
            return serverService.getSubpopulation(guid);
        });
        Promise.all(requests).then(function(subpopulations) {
            subpopulations.forEach(function(subpop) {
                var subpopHistories = histories[subpop.guid].map(function(record) {
                    var history = {};
                    history.consentURL = '/#/subpopulations/'+subpop.guid+'/consents/'+record.consentCreatedOn;
                    history.birthdate = new Date(record.birthdate).toLocaleDateString(); 
                    history.signedOn = new Date(record.signedOn).toLocaleString();
                    history.consentCreatedOn = new Date(record.consentCreatedOn).toLocaleString();
                    history.hasSignedActiveConsent = record.hasSignedActiveConsent;
                    if (record.withdrewOn) {
                        history.withdrewOn = new Date(record.withdrewOn).toLocaleString();
                    }
                    if (record.imageMimeType && record.imageData) {
                        history.imageData = "data:"+record.imageMimeType+";base64,"+record.imageData;
                    }
                    return history;
                });
                self.subpopulationsObs.push({
                    name: subpop.name,
                    history: subpopHistories.reverse()
                });
            });
        });
    }).catch(utils.errorHandler);

};