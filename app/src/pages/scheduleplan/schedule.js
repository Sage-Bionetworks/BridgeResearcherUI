var ko = require('knockout');
var utils = require('../../utils');
var surveyUtils = require('../../pages/survey/survey_utils');
var serverService = require('../../services/server_service');
var scheduleService = require('../../services/schedule_service');
var root = require('../../root');

/**
 * enrollment - used to calculate if enrollment should be included in the eventId.
 * When there's no eventId, enrollment is assumed; generally if there is any event,
 * enrollment would be included last in a comma-separated list of events.
 */
var SCHEDULE_FIELDS = ['delay','interval','scheduleType','expires','startsOn','endsOn','eventId',
    'cronTrigger', 'times[]', 'activities[]', 'enrollment'];

var ACTIVITY_FIELDS = ['label','labelDetail','activityType','taskId','surveyGuid'];

var SCHEDULE_TYPE_OPTIONS = Object.freeze([
    {value: 'once', label: 'Once'},
    {value: 'recurring', label: 'Recurring'}
]);
var ACTIVITY_TYPE_OPTIONS = Object.freeze([
    {value: 'task', label: 'Do Task'},
    {value: 'survey', label: 'Take Survey'}
]);
function newActivity() {
    var activity = scheduleService.newSchedule().activities[0];
    utils.observablesFor(activity, ACTIVITY_FIELDS);
    activity.activityTypeObs('task');
    return activity;
}
/**
 * Copy observers values in each schedule activity to that object. Slightly
 * more complicated than what ko.mapping provides.
 * @param activity
 */
function copyObserverValuesBackToActivity(activity) {
    activity.label = activity.labelObs();
    activity.labelDetail = activity.labelDetailObs();
    activity.activityType = activity.activityTypeObs();
    if (activity.activityType === 'task') {
        activity.task = {
            identifier: activity.taskIdObs()
        };
    } else {
        activity.survey = {
            guid: activity.surveyGuidObs(),
            identifier: surveyUtils.surveysOptionsFinder(activity.surveyGuidObs()).identifier
        };
    }
}
/**
 * Copy all the activity's fields to observers.
 * @param activity
 */
function addObserversToActivity(activity) {
    activity.labelObs = ko.observable(activity.label);
    activity.labelDetailObs = ko.observable(activity.labelDetail);
    activity.activityTypeObs = ko.observable(activity.activityType);
    activity.taskIdObs = ko.observable();
    if (activity.activityType === 'task') {
        activity.taskIdObs(activity.task.identifier);
    }
    activity.surveyGuidObs = ko.observable();
    if (activity.activityType === 'survey') {
        activity.surveyGuidObs(activity.survey.guid);
    }
}
/**
 * Times come back in "08:00:00.000" format, we only want HH:MM.
 * Not sure anything can be done about this, on the server?
 * @param schedule
 */
function fixScheduleTimes(schedule) {
    // TOD: These are also fixed in the formatter, but probably need to be fixed here as well.
    schedule.times = schedule.times.map(function(time) {
        return time.replace(":00.000","");
    });
    if (schedule.startsOn) {
        schedule.startsOn = schedule.startsOn.replace(":00.000Z","");
    }
    if (schedule.endsOn) {
        schedule.endsOn = schedule.endsOn.replace(":00.000Z","");
    }
    schedule.times.sort();
}

/**
 * Editor for a schedule (regardless of the strategy it is embedded in).
 * @param params
 *      - scheduleObs: schedule observer with a callback function attached to it.
 */
module.exports = function(params) {
    var self = this;

    self.scheduleObs = params.scheduleObs;
    utils.observablesFor(self, SCHEDULE_FIELDS);

    // This is the implementation called by the schedule plan viewModel to construct the model
    self.scheduleObs.callback = function() {
        self.activitiesObs().forEach(copyObserverValuesBackToActivity);
        utils.observablesToObject(self, self.scheduleObs(), SCHEDULE_FIELDS);

        // To avoid an error, if the type is "once", remove the repeating fields (that are hidden).
        if (self.scheduleObs().scheduleType === "once") {
            delete self.scheduleObs().interval;
            delete self.scheduleObs().cronTrigger;
        }
        return self.scheduleObs();
    };

    // This is fired when the parent viewModel gets a plan back from the server
    ko.computed(function() {
        var schedule = self.scheduleObs();
        if (schedule) {
            fixScheduleTimes(schedule);
            schedule.activities.forEach(addObserversToActivity);
            if (schedule.scheduleType === "once") {
                delete schedule.interval;
                delete schedule.cronTrigger;
            }
            utils.valuesToObservables(self, schedule, SCHEDULE_FIELDS);
        }
    });

    self.publishedObs = ko.observable(false);

    self.scheduleTypeOptions = SCHEDULE_TYPE_OPTIONS;
    self.scheduleTypeLabel = utils.makeOptionLabelFinder(SCHEDULE_TYPE_OPTIONS);

    self.activityTypeOptions = ACTIVITY_TYPE_OPTIONS;
    self.activityTypeLabel = utils.makeOptionLabelFinder(ACTIVITY_TYPE_OPTIONS);

    self.surveysOptionsObs = surveyUtils.surveysOptionsObs;
    self.surveysOptionsLabel = surveyUtils.surveysOptionsLabel;

    self.formatDateTime = utils.formatDateTime;
    self.formatTimes = function() {
        if (self.scheduleTypeObs() === 'recurring') {
            return scheduleService.formatTimesArray(self.timesObs());
        } else {
            return scheduleService.formatTimesArray(self.timesObs().slice(0,1));
        }
    };
    self.formatEventId = scheduleService.formatEventId;

    self.editTimes = function(vm, event) {
        event.preventDefault();
        root.openDialog('times_editor', {
            'timesObs': self.timesObs, 'clearTimesFunc': self.clearTimes
        });
    };
    self.clearTimes = function(vm, event) {
        event.preventDefault();
        self.timesObs([]);
    };
    self.editEventId = function(vm, event) {
        event.preventDefault();
        root.openDialog('event_id_editor', {
            'eventIdObs': self.eventIdObs,'clearEventIdFunc': self.clearEventId
        });
    };
    self.clearEventId = function(vm, event) {
        event.preventDefault();
        self.eventIdObs(null);
    };
    self.addFirstActivity = function(vm, event) {
        self.activitiesObs.push(newActivity());
    };
    self.addActivityAfter = function(vm, event) {
        event.preventDefault();
        var context = ko.contextFor(event.target);
        self.activitiesObs.splice(context.$index()+1,0,newActivity());
    };
    self.deleteActivity = function(vm, event) {
        event.preventDefault();
        var context = ko.contextFor(event.target);
        self.activitiesObs.remove(context.$data);
    };
};