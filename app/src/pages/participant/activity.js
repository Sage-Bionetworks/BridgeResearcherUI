var utils = require('../../utils');
var serverService = require('../../services/server_service');
var optionsService = require('../../services/options_service');
var scheduleUtils = require('../../pages/schedule/schedule_utils');
var bind = require('../../binder');
var root = require('../../root');
var jsonFormatter = require('../../json_formatter');
var tables = require('../../tables');
var fn = require('../../transforms');
var ko = require('knockout');

module.exports = function(params) {
    var self = this;
    // params.guid, params.userId

    self.startDate = null;
    self.endDate = null;
    self.formatTitleCase = fn.formatTitleCase;
    self.formatDateTime = fn.formatLocalDateTimeWithoutZone;
    self.formatDateTime = fn.formatLocalDateTime;

    self.formatActivityClass = function(item) {
        return (item.activity.activityType === "survey") ? "tasks icon" : "child icon";
    };
    self.formatActivity = function(item) {
        var act = item.activity;
        var string = act.label;
        if (act.detail) {
            string += " (" + act.detail + ") ";
        }
        return string;
    };

    var binder = bind(self)
        .obs('userId', params.userId)
        .obs('isNew', false)
        .obs('title', '&#160;')
        .obs('guid', params.guid)
        .obs('activityLabel', '&#160;');

    tables.prepareTable(self, {
        name: "activitie",
        type: "Activity",
        refresh: self.loadingFunc
    });
    
    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
    }).catch(utils.failureHandler());

    self.isPublicObs = root.isPublicObs;

    self.toggle = function(model) {
        model.collapsedObs(!model.collapsedObs());
    };

    serverService.getSchedulePlans().then(function(response) {
        response.items.forEach(function(plan) {
            scheduleUtils.getActivitiesWithStrategyInfo(plan).forEach(function(spec) {
                if (spec.guid == params.guid) {
                    self.activityLabelObs(spec.label);
                }
            });
        });
    }).catch(utils.notFoundHandler("Participant", "participants"));

    self.loadingFunc = function(offsetBy, pageSize, startDate, endDate) {
        return serverService.getParticipantActivities(self.userIdObs(), params.guid, {
            offsetBy: offsetBy,
            pageSize: pageSize,
            scheduledOnStart: startDate,
            scheduledOnEnd: endDate
        }).then(function(response) {
            response.items = response.items.map(jsonFormatter.mapClientDataItem);
            self.itemsObs(response.items);
            return response;
        })
        .catch(utils.notFoundHandler("Participant", "participants"));
    };
};