var utils = require('../../utils');
var serverService = require('../../services/server_service');
var scheduleUtils = require('../../pages/schedule/schedule_utils');
var bind = require('../../binder');
var root = require('../../root');
var tables = require('../../tables');

var ACTIVITY_SORTER = utils.makeFieldSorter("plan");

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('userId', params.userId)
        .obs('items[]', [])
        .obs('isNew', false)
        .obs('title', '&#160;');

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
    }).catch(utils.failureHandler());

    self.isPublicObs = root.isPublicObs;
    tables.prepareTable(self, {name:'activitie'});

    self.linkMaker = function(userId, guid) {
        return root.userPath()+userId+'/activities/'+guid;
    };

    serverService.getSchedulePlans().then(function(response) {
        var array = [];
        response.items.forEach(function(plan) {
            scheduleUtils.getActivitiesWithStrategyInfo(plan).forEach(function(spec) {
                array.push(spec);
            });
        });
        self.itemsObs(array.sort(ACTIVITY_SORTER));
    }).catch(utils.notFoundHandler("Participant", "participants"));
};