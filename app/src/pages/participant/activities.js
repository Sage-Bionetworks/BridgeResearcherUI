import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import root from '../../root';
import scheduleUtils from '../../pages/schedule/schedule_utils';
import tables from '../../tables';
import utils from '../../utils';

var failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});

module.exports = function(params) {
    var self = this;

    new Binder(self)
        .obs('userId', params.userId)
        .obs('items[]', [])
        .obs('isNew', false)
        .obs('status')
        .obs('title', '&#160;');

    fn.copyProps(self, root, 'isPublicObs');

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(part.name);
        self.statusObs(part.status);
    }).catch(failureHandler);

    tables.prepareTable(self, {name:'activitie'});

    self.linkMaker = function(userId, guid) {
        return root.userPath()+userId+'/activities/'+guid;
    };
    function processActivities(response) {
        var array = [];
        response.items.forEach(function(plan) {
            scheduleUtils.getActivitiesWithStrategyInfo(plan).forEach(function(spec) {
                array.push(spec);
            });
        });
        return {items: array};
    }
    serverService.getSchedulePlans()
        .then(processActivities)
        .then(fn.handleSort('items', 'plan'))
        .then(fn.handleObsUpdate(self.itemsObs, 'items'))
        .catch(failureHandler);
};