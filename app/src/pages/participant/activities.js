var utils = require('../../utils');
var serverService = require('../../services/server_service');
var scheduleUtils = require('../../pages/schedule/schedule_utils');
var bind = require('../../binder');
var root = require('../../root');
var tables = require('../../tables');
var fn = require('../../functions');

var failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('userId', params.userId)
        .obs('items[]', [])
        .obs('isNew', false)
        .obs('title', '&#160;');

    fn.copyProps(self, root, 'isPublicObs');

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
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