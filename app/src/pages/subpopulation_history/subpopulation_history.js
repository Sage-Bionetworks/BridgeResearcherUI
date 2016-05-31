var serverService = require('../../services/server_service');
var utils = require('../../utils');
var config = require('../../config');
var bind = require('../../binder');

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('active', true)
        .obs('createdOn')
        .obs('historyItems[]')
        .obs('guid', params.guid)
        .obs('name');

    serverService.getSubpopulation(params.guid).then(function(subpop) {
        self.nameObs(subpop.name);
    });

    function updateHistoryItems(response) {
        self.historyItemsObs(response.items);
        return response;
    }

    self.formatDateTime = utils.formatDateTime;

    self.publish = function(vm, event) {
        if (confirm("Are you sure you want to publish this consent?")) {
            utils.startHandler(vm, event);

            params.guid = vm.subpopulationGuid;
            params.createdOn = vm.createdOn;

            serverService.publishStudyConsent(params.guid, params.createdOn)
                .then(load)
                .then(utils.successHandler(vm, event, "Consent published"))
                .catch(utils.failureHandler(vm, event));
        }
    };
    
    function load() {
        return serverService.getConsentHistory(params.guid)
            .then(updateHistoryItems);
    }
    load();
};
