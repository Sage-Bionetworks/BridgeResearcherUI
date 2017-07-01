import { Binder } from '../../binder';
import alerts from '../../widgets/alerts';
import fn from '../../functions';
import serverService from '../../services/server_service';
import utils from '../../utils';

var failureHandler = utils.failureHandler({
    redirectMsg:"Consent group not found.", 
    redirectTo:"subpopulations"
});

module.exports = function(params) {
    var self = this;

    var binder = new Binder(self)
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
                .catch(failureHandler);
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
            .catch(failureHandler);
    }
    load();
};
