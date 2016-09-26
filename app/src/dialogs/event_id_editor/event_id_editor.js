var utils = require('../../utils');
var optionsService = require('./../../services/options_service');
var root = require('../../root');
var UNARY_EVENTS = require('../../pages/schedule/schedule_utils').UNARY_EVENTS;
var bind = require('../../binder');

/**
 * This editor no longer allows you to edit survey or question triggered events, although these 
 * are supported by the event system. These events are not generated when surveys are answered 
 * and submitted to Bridge, so there's no point in exposing a scheduling UI for these at this time. 
 */
module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('enrollment', true)
        .obs('enrollmentPeriod', Object.keys(UNARY_EVENTS)[0])
        .obs('answer')
        .obs('hasActivities', true)
        .obs('activityFinished', false)
        .obs('activity')
        .obs('activityOptions[]');

    self.clearEventIdFunc = params.clearEventIdFunc;
    self.eventIdObs = params.eventIdObs;
    self.activityLabel = utils.makeOptionLabelFinder(self.activityOptionsObs);

    self.saveAndCloseDialog = function() {
        var events = [];
        if (self.activityFinishedObs() && self.activityObs()) {
            events.push("activity:" + self.activityObs() + ":finished");
        }
        if (self.enrollmentObs()) {
            events.push(self.enrollmentPeriodObs());
        }
        self.eventIdObs(events.join(','));
        root.closeDialog();
    };
    self.clearAndCloseDialog = function(vm, event) {
        self.clearEventIdFunc(vm, event);
        root.closeDialog();
    };
    self.closeDialog = function() {
        root.closeDialog();
    };

    function loadActivityOptions() {
        return optionsService.getActivityOptions();
    }
    function initEditor() {
        if (self.activityOptionsObs().length === 0) {
            self.hasActivitiesObs(false);
        }
        if (self.eventIdObs()) {
            self.enrollmentObs(false);
            self.activityFinishedObs(false);
            self.eventIdObs().split(",").forEach(function(eventId) {
                if (Object.keys(UNARY_EVENTS).indexOf(eventId) > -1) {
                    self.enrollmentObs(true);
                    self.enrollmentPeriodObs(eventId);
                } else {
                    var parts = eventId.split(":");
                    if (parts[0] === "activity") {
                        self.activityFinishedObs(true);
                        self.activityObs(parts[1]);
                    }
                }
            });
        }
    }
    optionsService.getSurveyOptions()
        .then(loadActivityOptions)
        .then(self.activityOptionsObs)
        .then(initEditor);
};