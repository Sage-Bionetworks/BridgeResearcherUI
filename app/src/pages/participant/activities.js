var utils = require('../../utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');
var fn = require('../../transforms');
var alerts = require('../../widgets/alerts');
var tables = require('../../tables');

var deleteMsg = "In development, you can delete all activities on a test account in order to work on an app.\n\n" +
    "In production, all activity state is lost, so activities will be recreated the next time the user asks for them. " +
    "Users can see deleted and finished activities reappear. Do you wish to continue?";

module.exports = function(params) {
    var self = this;

    var binder = bind(self)
        .obs('userId', params.userId)
        .obs('items[]', [])
        .obs('total', 0)
        .obs('isNew', false)
        .obs('title', '&#160;');

    tables.prepareTable(self, 'activitie');

    serverService.getParticipantName(params.userId).then(self.titleObs);

    self.formatTitleCase = fn.formatTitleCase;
    self.formatDateTime = fn.formatLocalDateTimeWithoutZone;
    
    self.displayBorder = function(item, index) {
        var next = self.itemsObs()[index()+1];
        if (!next) {
            return false;
        }
        var guid1 = item.guid.split(":")[0];
        var guid2 = next.guid.split(":")[0];
        return (guid1 !== guid2);
    };
    self.formatActivityClass = function(item) {
        return (item.activity.activityType === "task") ? "child icon" : "tasks icon";
    };
    self.formatActivity = function(item) {
        return item.activity.label;
    };
    self.deleteActivities = function(vm, event) {
        alerts.deleteConfirmation(deleteMsg, function() {
            utils.startHandler(vm, event);
            serverService.deleteParticipantActivities(self.userIdObs())
                .then(utils.successHandler(self, event, "Activities deleted"))
                .then(self.loadingFunc)
                .catch(utils.failureHandler(vm, event));
        });
    };

    function msgIfNoRecords(response) {
        if (response.items.length === 0) {
            self.recordsMessageObs("There are no activities for this participant.");
        }
        return response;
    }

    self.loadingFunc = function loadPage(params) {
        return serverService.getParticipantActivities(self.userIdObs(), params)
            .then(binder.update('total','items'))
            .then(msgIfNoRecords)
            .catch(utils.notFoundHandler("Participant", "participants"));
    };    
};