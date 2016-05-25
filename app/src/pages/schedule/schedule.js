var ko = require('knockout');
var utils = require('../../utils');
var optionsService = require('../../services/options_service');
var scheduleUtils = require('./schedule_utils');
var root = require('../../root');
var bind = require('../../binder');

var SCHEDULE_TYPE_OPTIONS = Object.freeze([
    {value: 'once', label: 'Once'},
    {value: 'recurring', label: 'Recurring'}
]);
var ACTIVITY_TYPE_OPTIONS = Object.freeze([
    {value: 'task', label: 'Do Task'},
    {value: 'survey', label: 'Take Survey'}
]);
function newActivity() {
    var activity = scheduleUtils.newSchedule().activities[0];
    addObserversToActivity(activity);
    activity.activityTypeObs('task');
    return activity;
}
function addObserversToActivity(activity) {
    var actType = activity.activityType;
    activity.binder = bind(activity)
        .bind('label', activity.label)
        .bind('labelDetail', activity.labelDetail)
        .bind('activityType', activity.activityType, null, createActivitySubjectReference)
        .obs('taskId', (actType === 'task') ? activity.task.identifier : null)
        .obs('surveyGuid', (actType === 'survey') ? activity.survey.guid : null);
}
// Activities refer to a thing you should do (task or survey), create that from the type 
// and some observers for the specific keys involved.
function createActivitySubjectReference(value, context) {
    if (value === "task") {
        context.copy.task = {
            identifier: context.vm.taskIdObs()
        }
    } else if (value === "survey") {
        context.copy.survey = {
            guid: context.vm.surveyGuidObs()
        }
    }
}
/**
 * Copy observers values in each schedule activity to that object. Slightly
 * more complicated than what ko.mapping provides.
 * @param activity
 */
function mapActivityObservers(activity) {
    return activity.binder.persist({});
}
/**
 * Times come back in "08:00:00.000" format, we only want HH:MM.
 * Not sure anything can be done about this, on the server?
 * @param schedule
 */
function fixScheduleTimes(schedule) {
    // TODO: These are also fixed in the formatter, but probably need to be fixed here as well.
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
    self.collectionName = params.collectionName;
    
    var binder = bind(self)
        .bind('delay')
        .bind('interval')
        .bind('scheduleType')
        .bind('expires')
        .bind('startsOn')
        .bind('endsOn')
        .bind('eventId', 'enrollment')
        .bind('cronTrigger')
        .bind('times[]')
        .obs('activities[]')
        .obs('surveysOptions[]')
        .obs('taskOptions[]')
        .obs('editorScheduleType', 'once')

    self.scheduleTypeOptions = SCHEDULE_TYPE_OPTIONS;
    self.scheduleTypeLabel = utils.makeOptionLabelFinder(SCHEDULE_TYPE_OPTIONS);

    self.activityTypeOptions = ACTIVITY_TYPE_OPTIONS;
    self.activityTypeLabel = utils.makeOptionLabelFinder(ACTIVITY_TYPE_OPTIONS);

    self.surveysOptionsObs.extend({rateLimit: 50});
    self.surveysOptionsLabel = utils.makeOptionLabelFinder(self.surveysOptionsObs);

    self.taskOptionsObs.extend({rateLimit: 50});
    self.taskOptionsLabel = utils.makeOptionLabelFinder(self.taskOptionsObs);

    // This combines the scheduleType with the difference between interval and cron-based recurring schedules
    self.editorScheduleTypeObs.subscribe(function(newValue) {
        self.scheduleTypeObs( (newValue === "once") ? 'once' : 'recurring' );    
    });
    
    function updateEditorScheduleType(schedule) {
        if (schedule.scheduleType === 'once') {
            self.editorScheduleTypeObs("once");
        } else if (schedule.scheduleType === 'recurring' && schedule.cronTrigger) {
            self.editorScheduleTypeObs("cron");
        } else {
            self.editorScheduleTypeObs("interval");
        }
    }

    // This is the implementation called by the schedule plan viewModel to construct the model
    self.scheduleObs.callback = function() {
        var schedule = binder.persist(self.scheduleObs());
        schedule.activities = self.activitiesObs().map(mapActivityObservers);

        // To avoid an error, we have to remove some fields which are hidden and assumed to be unused
        if (schedule.scheduleType === "once") {
            delete schedule.interval;
            delete schedule.cronTrigger;
        } else if (self.editorScheduleTypeObs() === "interval") {
            delete schedule.cronTrigger;
        } else if (self.editorScheduleTypeObs() === "cron") {
            delete schedule.interval;
            schedule.times = [];
        }
        return schedule;
    };

    var subscription = self.scheduleObs.subscribe(function(schedule) {
        fixScheduleTimes(schedule);
        updateEditorScheduleType(schedule);
        schedule.activities.forEach(addObserversToActivity);
        // TODO: There's probably a better way to do this.
        schedule.activities.forEach(function(activity) {
            if (activity.survey && !self.surveysOptionsObs.loaded) {
                self.surveysOptionsObs.push({label: 'Loading...', value: activity.survey.guid});
            }
            if (activity.task && !self.taskOptionsObs.loaded) {
                self.taskOptionsObs.push({label: activity.task.identifier, value: activity.task.identifier});
            }
        });
        if (schedule.scheduleType === "once") {
            delete schedule.interval;
            delete schedule.cronTrigger;
        }
        binder.update()(schedule);
        subscription.dispose();
    });
    
    // Above, when an activity with a survey is loaded, if there's no option for it,
    // it is not selected and then ends up being the first option when it comes in.
    // Put a dummy loading option in to fix that. But then, if this very first, the
    // loading option is not removed. So the .loaded property is used to guard against
    // thats. In all, ugly.
    optionsService.getSurveyOptions().then(function(surveys) {
        self.surveysOptionsObs.removeAll();
        self.surveysOptionsObs.push({value:"",label:"Select survey:"})
        self.surveysOptionsObs.pushAll(surveys);
        self.surveysOptionsObs.loaded = true;
    });
    optionsService.getTaskIdentifierOptions().then(function(options) {
        // In this case as a transition, if we have an identifier that hasn't been enumerated,
        // don't update the options because we're displaying it as a dummy option. It'll still
        // fail when the user saves it.
        self.taskOptionsObs.removeAll();
        self.taskOptionsObs.push({value:"",label:"Select task:"})
        if (options.length > 0) {
            self.taskOptionsObs.pushAll(options);
        }
        self.taskOptionsObs.loaded = true;
    });

    self.formatDateTime = utils.formatDateTime;
    self.formatTimes = function() {
        var type = self.scheduleTypeObs();
        var times = self.timesObs();
        if (times && times.length) {
            return scheduleUtils.formatTimesArray(
                (type === 'recurring') ? times : times.slice(0,1));
        }
        return scheduleUtils.formatTimesArray(null);
    };
    self.formatEventId = scheduleUtils.formatEventId;

    self.editTimes = function(vm, event) {
        event.preventDefault();
        root.openDialog('times_editor', {
            timesObs: self.timesObs,
            scheduleTypeObs: self.scheduleTypeObs,
            clearTimesFunc: self.clearTimes
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
    self.formatWindow = function() {
        if (self.startsOnObs() || self.endsOnObs()) {
            var string = "";
            if (self.startsOnObs()) {
                string += new Date(self.startsOnObs()).toUTCString();
            }
            string += "&mdash;";
            if (self.endsOnObs()) {
                string += new Date(self.endsOnObs()).toUTCString();
            }
            return string;
        }
        return "&lt;None&gt;";
    };
    self.editWindow = function(vm, event) {
        event.preventDefault();
        root.openDialog('date_window_editor', {
            'startsOnObs': self.startsOnObs,
            'endsOnObs': self.endsOnObs,
            'clearWindowFunc': self.clearWindow
        });
    };
    self.clearWindow = function() {
        self.startsOnObs(null);
        self.endsOnObs(null);
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