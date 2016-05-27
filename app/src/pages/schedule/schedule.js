var optionsService = require('../../services/options_service');
var scheduleUtils = require('./schedule_utils');
var utils = require('../../utils');
var root = require('../../root');
var ko = require('knockout');

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
    } else {
        return "interval";
    }
}
function getScheduleType(editorType) {
    return (editorType === "once") ? 'once' : 'recurring';
}

module.exports = function(params) {
    var self = this;
    self.collectionName = params.collectionName;
        
    self.scheduleTypeOptions = SCHEDULE_TYPE_OPTIONS;
    self.scheduleTypeLabel = utils.makeOptionLabelFinder(SCHEDULE_TYPE_OPTIONS);

    self.activityTypeOptions = ACTIVITY_TYPE_OPTIONS;
    self.activityTypeLabel = utils.makeOptionLabelFinder(ACTIVITY_TYPE_OPTIONS);    

    observe(self, "eventId")
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
            }
            utils.deleteUnusedProperties(sch);
            return sch;
        },
        write: function(schedule) {
            console.log(schedule.scheduleType);
            updateView(self, schedule, ['eventId','scheduleType','startsOn','endsOn','delay',
                'interval','times','cronTrigger','expires']);
            self.editorScheduleTypeObs(getEditorType(schedule));
            self.activitiesObs(schedule.activities.map(addObserversToActivity));
        }
    });
    
    params.scheduleObs.subscribe(self.scheduleObs);
    params.scheduleObs.callback = function() {
        return self.scheduleObs();
    }
    
    self.editorScheduleTypeObs = ko.observable();
    self.editorScheduleTypeObs.subscribe(function(newValue) {
        self.scheduleTypeObs( getScheduleType(newValue) );    
    });
    
    self.formatDateTime = utils.formatDateTime;
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
    self.deleteActivity = function(vm, event) {
        event.preventDefault();
        var context = ko.contextFor(event.target);
        self.activitiesObs.remove(context.$data);
    };    

    self.surveysOptionsObs = ko.observableArray();
    self.surveysOptionsObs.extend({rateLimit: 50});
    self.surveysOptionsLabel = utils.makeOptionLabelFinder(self.surveysOptionsObs);

    self.taskOptionsObs = ko.observableArray();
    self.taskOptionsObs.extend({rateLimit: 50});
    self.taskOptionsLabel = utils.makeOptionLabelFinder(self.taskOptionsObs);

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
}