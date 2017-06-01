var serverService = require('../../../services/server_service');
var tables = require('../../../tables');
var alerts = require('../../../widgets/alerts');
var Promise = require('bluebird');
var ko = require('knockout');
var fn = require('../../../functions');
var utils = require('../../../utils');

var PAGE_SIZE = 100;
var DELAY = 200;
var adminEmail = null;
var MSG = "Are you sure you want to sign out everyone in this study?";

function mapKey(cacheKey) {
    return {key: cacheKey};
}
function deleteItem(item) {
    return serverService.deleteCacheKey(item.key);
}
serverService.addSessionStartListener(function(session) {
    adminEmail = session.email; 
});
serverService.addSessionEndListener(function() {
    adminEmail = null;
});

module.exports = function() {
    var self = this;
    
    self.signOutStatusObs = ko.observable();

    tables.prepareTable(self, {
        name: 'cache key',
        delete: deleteItem
    });

    serverService.getCacheKeys().then(function(response) {
        var items = response.map(mapKey);
        self.itemsObs(items.sort(fn.makeFieldSorter("key")));
    }).catch(utils.failureHandler());

    self.signEveryoneOut = function() {
        alerts.deleteConfirmation(MSG, function() {
            // Call the first time to get the total number of records
            serverService.getParticipants(0, 5).then(processAllPages);
        }, "Yes, sign everyone out");
    };
    function processAllPages(response) {
        var pages = Math.ceil(response.total/PAGE_SIZE);
        var promise = Promise.resolve();
        for (var i=0; i <= pages; i++) {
            promise = promise.delay(DELAY).then(processOnePage(promise, i));
        }
        promise.then(function() {
            self.signOutStatusObs("That's it. Everyone has been signed out.");
        });
    }
    function processOnePage(promise, i) {
        return function() {
            return serverService.getParticipants(PAGE_SIZE*i, PAGE_SIZE).then(processAllRecords(promise));
        };
    }
    function processAllRecords(promise) {
        return function(response) {
            return response.items.filter(filterParticipants).reduce(processOneRecord, promise);    
        };
    }
    function filterParticipants(participant) {
        return (participant.status !== "unverified" && participant.email !== adminEmail);
    }
    function processOneRecord(p, participant) {
        p = p.delay(DELAY).then(function() {
            self.signOutStatusObs("Signing out user: " + participant.email);
            return serverService.signOutUser(participant.id);
        });
        return p;
    }
};