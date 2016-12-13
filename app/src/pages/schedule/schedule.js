var optionsService = require('../../services/options_service');
var scheduleUtils = require('./schedule_utils');
var utils = require('../../utils');
var fn = require('../../transforms');
var root = require('../../root');
var ko = require('knockout');

var SCHEDULE_TYPE_OPTIONS = Object.freeze([
    {value: 'once', label: 'Once'},
    {value: 'recurring', label: 'Recurring'},
    {value: 'cron', label: 'Cron-based'},
    {value: 'persistent', label: 'Persistent'}
]);
var ACTIVITY_TYPE_OPTIONS = Object.freeze([
    {value: 'task', label: 'Do Task'},
    {value: 'survey', label: 'Take Survey'}
]);
function newActivity() {
    var activity = scheduleUtils.newSchedule().activities[0];
    activity.activityType = "task";
    addObserversToActivity(activity);
    return activity;
}
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
    return activity;
}
function extractActivityFromObservables(activity) {
    var act = {
        label: activity.labelObs(),
        guid: activity.guid,
        labelDetail: activity.labelDetailObs(),
        activityType: activity.activityTypeObs()
    };
    if (act.activityType === 'task') {
        act.task = {identifier: activity.taskIdObs()};
    } else if (act.activityType === 'survey') {
        act.survey = {guid: activity.surveyGuidObs()};
    }
    return act;
}
function observe(self, name, isArray) {
    self[name+"Obs"] = (isArray) ? ko.observableArray() : ko.observable();
}
function updateView(self, schedule, fields) {
    fields.forEach(function(field) {
        self[field+"Obs"](schedule[field]);    
    });
}
function getEditorType(schedule) {
    if (schedule.scheduleType === 'once') {
        return "once";
    } else if (schedule.scheduleType === 'recurring' && schedule.cronTrigger) {
        return "cron";
    } else if (schedule.scheduleType === 'recurring') {
        return "interval";
    }
    return "persistent";
}
function getScheduleType(editorType) {
    return (editorType === "cron" || editorType === "interval") ? 'recurring' : editorType;
}

module.exports = function(params) {
    var self = this;
    self.collectionName = params.collectionName;
        
    self.scheduleTypeOptions = SCHEDULE_TYPE_OPTIONS;
    self.scheduleTypeLabel = utils.makeOptionLabelFinder(SCHEDULE_TYPE_OPTIONS);

    self.activityTypeOptions = ACTIVITY_TYPE_OPTIONS;
    self.activityTypeLabel = utils.makeOptionLabelFinder(ACTIVITY_TYPE_OPTIONS);    

    observe(self, "eventId");
    observe(self, "scheduleType");
    observe(self, "startsOn");
    observe(self, "endsOn");
    observe(self, "delay");
    observe(self, "interval");
    observe(self, "times");
    observe(self, "cronTrigger");
    observe(self, "expires");
    observe(self, "activities", true);
    
    self.scheduleObs = ko.pureComputed({
        read: function() {
            var sch = {
                eventId: self.eventIdObs(),
                scheduleType: self.scheduleTypeObs(),
                startsOn: self.startsOnObs(),
                endsOn: self.endsOnObs(),
                delay: self.delayObs(),
                interval: self.intervalObs(),
                times: self.timesObs(),
                cronTrigger: self.cronTriggerObs(),
                expires: self.expiresObs(),
                activities: self.activitiesObs().map(extractActivityFromObservables)
            };
            utils.deleteUnusedProperties(sch);
            // some of these properties are mutually exclusive so based on the type of schedule,
            // delete some fields. This comes up if you schedule one way, then change and schedule another 
            // way.
            switch( self.editorScheduleTypeObs() ) {
                case 'once':
                    delete sch.interval;
                    delete sch.cronTrigger;
                    break;
                case 'interval':
                    delete sch.cronTrigger;
                    break;
                case 'cron':
                    delete sch.interval;
                    delete sch.times;
                    break;
                case 'persistent':
                    delete sch.interval;
                    delete sch.cronTrigger;
                    delete sch.times;
                    delete sch.delay;
                    delete sch.expires;
            }
            return sch;
        },
        write: function(schedule) {
            updateView(self, schedule, ['eventId','scheduleType','startsOn','endsOn','delay',
                'interval','times','cronTrigger','expires']);
            self.editorScheduleTypeObs(getEditorType(schedule));
            self.activitiesObs(schedule.activities.map(addObserversToActivity));
        }
    });
    
    params.scheduleObs.subscribe(self.scheduleObs);
    params.scheduleObs.callback = function() {
        return self.scheduleObs();
    };
    
    self.editorScheduleTypeObs = ko.observable();
    self.editorScheduleTypeObs.subscribe(function(newValue) {
        self.scheduleTypeObs( getScheduleType(newValue) );    
    });
    
    self.formatDateTime = fn.formatLocalDateTime;
    self.formatEventId = scheduleUtils.formatEventId;
    self.formatTimes = scheduleUtils.formatTimesArray;

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
    self.editEventId = function(vm, event) {
        event.preventDefault();
        root.openDialog('event_id_editor', 
            {'eventIdObs': self.eventIdObs,'clearEventIdFunc': self.clearEventId});
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

    // These are all loaded as part of the schedule plan, and cached in scheduleUtils,
    // so these should always render correctly when the schedule plan loads from the 
    // server.
    self.surveysOptionsObs = scheduleUtils.surveysOptionsObs;
    self.surveysOptionsLabel = scheduleUtils.surveysOptionsLabel;
    self.taskOptionsObs = scheduleUtils.taskOptionsObs;
    self.taskOptionsLabel = scheduleUtils.taskOptionsLabel;
};