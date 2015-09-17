var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service.js');
var scheduleService = require('../../services/schedule_service.js');

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
            identifier: scheduleService.getSurveyIdentifierWithGuid(activity.surveyGuidObs()).identifier
        };
    }
}
/**
 * Copy properties of activity in a schedule to observers for editing. Slightly
 * more complicated than what ko.mapping provides.
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

function newActivity() {
    var activity = {label:'', labelDetail:'', activityType:'task', taskId:'', surveyGuid:''};
    utils.observablesFor(activity, ACTIVITY_FIELDS);
    return activity;
}

module.exports = function(params) {
    var self = this;

    self.strategyObs = params.strategyObs;
    utils.observablesFor(self, SCHEDULE_FIELDS);

    // This is the implementation called by the schedule plan viewModel to construct
    // the model
    params.delegate.strategy = function() {
        var strategy = self.strategyObs();
        self.activitiesObs().forEach(copyObserverValuesBackToActivity);
        utils.observablesToObject(self, strategy.schedule, SCHEDULE_FIELDS);
        return strategy;
    };

    // This is fired when the parent viewModel gets a plan back from the server
    ko.computed(function() {
        var strategy = self.strategyObs();
        if (strategy) {
            // Problems:
            // times come back in "08:00:00.000" format
            // periods are not parsed into their repsective fields
            // startsOn and endsOn are not LocalDates, they are absolute date strings.
            // Let's fix these manually just for now:
            strategy.schedule.times = strategy.schedule.times.map(function(time) {
                return time.replace(":00.000","");
            });
            if (strategy.schedule.startsOn) {
                strategy.schedule.startsOn = strategy.schedule.startsOn.replace(":00.000Z","");
            }
            if (strategy.schedule.endsOn) {
                strategy.schedule.endsOn = strategy.schedule.endsOn.replace(":00.000Z","");
            }
            strategy.schedule.times.sort();
            strategy.schedule.activities.forEach(addObserversToActivity);
            utils.valuesToObservables(self, strategy.schedule, SCHEDULE_FIELDS);
        }
    });

    self.publishedObs = ko.observable(false);

    self.scheduleTypeOptions = SCHEDULE_TYPE_OPTIONS;
    self.scheduleTypeLabel = utils.makeFinderByLabel(SCHEDULE_TYPE_OPTIONS);

    self.activityTypeOptions = ACTIVITY_TYPE_OPTIONS;
    self.activityTypeLabel = utils.makeFinderByLabel(ACTIVITY_TYPE_OPTIONS);

    self.surveysOptionsObs = scheduleService.surveysOptionsObs;
    self.surveysOptionsLabel = scheduleService.surveysOptionsLabel;

    self.formatDateTime = utils.formatDateTime;
    self.formatTimes = scheduleService.formatTimesArray;
    self.formatEventId = scheduleService.formatEventId;

    self.editTimes = function(vm, event) {
        event.preventDefault();
        utils.openDialog('times_editor', {
            'timesObs': self.timesObs, 'clearTimesFunc': self.clearTimes
        });
    };
    self.clearTimes = function(vm, event) {
        event.preventDefault();
        self.timesObs([]);
    };
    self.editEventId = function(vm, event) {
        event.preventDefault();
        utils.openDialog('add_event_dialog', {
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