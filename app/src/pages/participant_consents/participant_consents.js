var utils = require('../../utils');
var serverService = require('../../services/server_service');
var Promise = require('bluebird');
var root = require('../../root');
var bind = require('../../binder');

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('id', params.id)
        .obs('consentHistory[]')
        .obs('isNew', false)
        .obs('title', params.name);

    self.isResearcher = root.isResearcher;

    serverService.getParticipant(self.idObs()).then(function(response) {
        var histories = response.consentHistories;
        
        // NOTE: This isn't going to tell the viewer anything about *which* of these
        // consent groups the user should or should not be assigned to.
        var requests = Object.keys(histories).map(function(guid) {
            return serverService.getSubpopulation(guid);
        });
        Promise.all(requests).then(function(subpopulations) {
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
                    }
                    if (record.imageMimeType && record.imageData) {
                        history.imageData = "data:"+record.imageMimeType+";base64,"+record.imageData;
                    }
                    self.consentHistoryObs.push(history);
                });
            });
        });
    }).catch(utils.failureHandler());

};