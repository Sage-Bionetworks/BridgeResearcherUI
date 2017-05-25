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

    fn.copyProps(self, fn, 'formatDateTime');

    self.publish = function(item, event) {
        alerts.confirmation("Are you sure you want to publish this consent?", function() {
            utils.startHandler(self, event);

            fn.copyProps(params, item, 'subpopulationGuid->guid', 'createdOn');
            serverService.publishStudyConsent(params.guid, params.createdOn)
                .then(load)
                .then(utils.successHandler(self, event, "Consent published"))
                .catch(utils.failureHandler(self, event));
        });
    };
    
    function getHistory() {
        return serverService.getConsentHistory(params.guid);
    }
    function addActiveFlag(item) {
        item.active = (self.publishedConsentCreatedOnObs() === item.createdOn);
    }

    function load() {
        return serverService.getSubpopulation(params.guid)
            .then(binder.update())
            .then(getHistory)
            .then(fn.handleForEach('items', addActiveFlag))
            .then(fn.handleObsUpdate(self.historyItemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};
