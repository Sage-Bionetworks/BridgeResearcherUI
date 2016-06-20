var utils = require('../../utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');

module.exports = function(params) {
    var self = this;

    var binder = bind(self)
        .obs('userId', params.userId)
        .obs('items[]')
        .obs('total', 0)
        .obs('isNew', false)
        .obs('title', params.name);

    self.titleCase = function(value) {
        return value.substring(0,1).toUpperCase() + value.substring(1);
    };
    self.formatDateTime = function(dateTime) {
        if (dateTime) {
            var components = new Date(dateTime).toISOString().split("T");
            var time = components[1].split(/[Z+-]/)[0];
            time = time.replace(/:00\.000$/,'');
            var date = components[0];
            var offset = new Date(dateTime).toString().match(/GMT([^\s]*)/)[1];
            offset = offset.replace(/00$/,":00");
            var localDate = date + "T" + time + offset;
            return new Date(localDate).toLocaleDateString() + " @ " + time;
        }
        return "";
    };
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

    function msgIfNoRecords(response) {
        if (response.items.length === 0) {
            document.querySelector(".loading_status").textContent = "There are no activities for this participant.";
        }
        return response;
    }
    var userId = params.userId;

    self.loadingFunc = function loadPage(params) {
        return serverService.getParticipantActivities(userId, params)
            .then(binder.update('total','items'))
            .then(msgIfNoRecords)
            .catch(utils.failureHandler());
    };    
};