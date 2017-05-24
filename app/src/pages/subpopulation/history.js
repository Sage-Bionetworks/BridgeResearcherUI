var serverService = require('../../services/server_service');
var utils = require('../../utils');
var bind = require('../../binder');
var fn = require('../../functions');
var alerts = require('../../widgets/alerts');

module.exports = function(params) {
    var self = this;

    var binder = bind(self)
        .obs('active', true)
        .obs('createdOn')
        .obs('historyItems[]')
        .obs('guid', params.guid)
        .obs('publishedConsentCreatedOn')
        .obs('name');

    self.formatDateTime = fn.formatDateTime;

    self.publish = function(vm, event) {
        alerts.confirmation("Are you sure you want to publish this consent?", function() {
            utils.startHandler(vm, event);

            params.guid = vm.subpopulationGuid;
            params.createdOn = vm.createdOn;

            serverService.publishStudyConsent(params.guid, params.createdOn)
                .then(load)
                .then(utils.successHandler(vm, event, "Consent published"))
                .catch(utils.failureHandler(vm, event));
        });
    };
    
    function getHistory() {
        return serverService.getConsentHistory(params.guid);
    }
    function addActiveFlag(item) {
        item.active = (self.publishedConsentCreatedOnObs() === item.createdOn);
        return item;
    }
    function updateHistory(response) {
        self.historyItemsObs(response.items.map(addActiveFlag));
    }

    function load() {
        return serverService.getSubpopulation(params.guid)
            .then(binder.update('name','publishedConsentCreatedOn'))
            .then(getHistory)
            .then(updateHistory);
    }
    load();
};
