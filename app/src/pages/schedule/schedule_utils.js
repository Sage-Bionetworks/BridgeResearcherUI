var ko = require('knockout');
var utils = require('../../utils');
var criteriaUtils = require('../../criteria_utils');
var optionsService = require('./../../services/options_service');
var activitiesObs = ko.observableArray([]);
var activityOptionsLabel = utils.makeOptionLabelFinder(activitiesObs);
var Promise = require('bluebird');

var surveysOptionsObs = ko.observableArray([]);
var surveysOptionsLabel = utils.makeOptionLabelFinder(surveysOptionsObs);

var questionsOptionsObs = ko.observableArray([]);
var questionsOptionsLabel = utils.makeOptionLabelFinder(questionsOptionsObs);

var TYPE_OPTIONS = Object.freeze([
    {value: 'SimpleScheduleStrategy', label: 'Simple Schedule'},
    {value: 'ABTestScheduleStrategy', label: 'A/B Test Schedule'},
    {value: 'CriteriaScheduleStrategy', label: 'Criteria-based Schedule'}
]);

var PERIOD_WORDS = Object.freeze({
    'H': 'hour',
    'D': "day",
    'M': "month",
    'W': 'week',
    'Y': 'year'
});

var UNARY_EVENTS = Object.freeze({
    'enrollment': 'On enrollment',
    'two_weeks_before_enrollment': 'Two weeks before enrollment',
    'two_months_before_enrollment': 'Two months before enrollment'
});

var TIME_OPTIONS = [];
var MINUTES = ["00","30"];
var timeFormatter = utils.makeOptionLabelFinder(TIME_OPTIONS);

function fillTime(min) {
    TIME_OPTIONS.push({
        label: hour+":"+min+" "+meridian,
        value: hour24+":"+min
    });
}
for (var i=0; i < 24; i++) {
    var hour = (i === 0) ? 12 : (i > 12) ? i-12 : i;
    var hour24 = (i < 10) ? ("0"+i) : (""+i);
    var meridian = (i < 12) ? "AM" : "PM";
    MINUTES.forEach(fillTime);
}

function formatEventId(value) {
    if (!value) {
        return "On enrollment (default)";
    }
    return value.split(',').reverse().map(function(value) {
        if (UNARY_EVENTS[value]) {
            return UNARY_EVENTS[value];
        }
        // events have three parts, e.g. survey:<guid>:finished
        var parts = value.split(":");
        if (parts[0] === "survey") {
            var surveyLabel = surveysOptionsLabel(parts[1]);
            return "when survey '"+surveyLabel+"' is finished";
        } else if (parts[0] === "question") {
            var questionLabel = questionsOptionsLabel(parts[1]);
            var answerValue = parts[2].split("=")[1];
            return "when question '"+questionLabel+"' is answered with value '"+answerValue+"'";
        } else if (parts[0] === "activity") {
            var activityLabel = activityOptionsLabel(parts[1]);
            return "when activity '"+activityLabel+"' is finished";
        }
        return " " + value;
    }).join(', and ');
}
function formatTimesArray(times) {
    return (times && times.length) ? toList(times.map(function(time) {
        time = time.replace(":00.000","");
        // If there's no label, it's an odd time. Just leave it for now.
        return timeFormatter(time) || time;
    })) : "<None>";
}
function formatActivities(buffer, activities) {
    var actMap = {};
    activities.map(function(act) {
        var label = 'do task (not specified)';

        // This may be way too complicated, it still does not show the underlying *real* name
        // of the thing being linked to in the schedule
        if (act.activityType === "task" && act.task) {
            label = "do task '"+activityOptionsLabel(act.guid)+"'";
        } else if (act.activityType === "survey" && act.survey) {
            label = "do survey '"+activityOptionsLabel(act.guid)+"'";
        }
        actMap[label] = ++actMap[label] || 1;
    });
    Object.keys(actMap).forEach(function(label) {
        return buffer.push(label + " " + (actMap[label] === 1 ? "" : (actMap[label] + " times")));
    });
}
function formatActivitiesAvailable(buffer, activities) {
    var actMap = {};
    activities.map(function(act) {
        var label = 'a task (not specified)';

        // This may be way too complicated, it still does not show the underlying *real* name
        // of the thing being linked to in the schedule
        if (act.activityType === "task" && act.task) {
            label = "the task '"+activityOptionsLabel(act.guid)+"'";
        } else if (act.activityType === "survey" && act.survey) {
            label = "the survey '"+activityOptionsLabel(act.guid)+"'";
        }
        actMap[label] = ++actMap[label] || 1;
    });
    Object.keys(actMap).forEach(function(label) {
        return buffer.push(label + " " + (actMap[label] === 1 ? "" : (actMap[label] + " times")));
    });
}
function sentenceCase(string) {
    return string.substring(0,1).toUpperCase() + string.substring(1);
}
function parsePeriods(period) {
    var periods = period.substring(1).match(/(\d+\D)/g);
    return periods.map(function(period) {
        var amt = parseInt(period, 10);
        var measure = PERIOD_WORDS[period.replace(/[\d]*/, '')];
        return {amt: amt, measure: measure};
    });
}
function periodToWords(periodStr) {
    var periods = parsePeriods(periodStr);
    return periods.map(function(period) {
        if (period.amt === 1 && period.measure === "H") {
            return "an " + period.measure;
        } else if (period.amt === 1) {
            return "a " + period.measure;
        }
        return period.amt + " " + period.measure + "s";
    }).join(', ');
}
function periodToWordsNoArticle(periodStr) {
    var periods = parsePeriods(periodStr);
    return periods.map(function(period) {
        return (period.amt === 1) ?
            (period.amt + " " + period.measure) :
            (period.amt + " " + period.measure+"s");
    }).join(', ');
}
function toList(array) {
    var len = array.length;
    if (len === 0) {
        return "";
    } else if (len === 1) {
        return array[0];
    } else if (len === 2) {
        return array[0] + " and " + array[1];
    } else {
        array[array.length-1] = "and " + array[array.length-1];
        return array.join(", ");
    }
}
function newStrategy(type, existingStrategy) {
    var schedules = (existingStrategy) ? extractSchedules(existingStrategy) : [newSchedule()];
    switch(type) {
        case 'SimpleScheduleStrategy':
            return cloneSimpleStrategy(schedules);
        case 'ABTestScheduleStrategy':
            return cloneABTestStrategy(schedules);
        case 'CriteriaScheduleStrategy':
            return cloneCriteriaStrategy(schedules);
        default:
            throw new Error("Strategy type " + type + " not mapped.");
    }
}
function extractSchedules(strategy) {
    switch(strategy.type) {
        case 'SimpleScheduleStrategy':
            return [strategy.schedule];
        case 'ABTestScheduleStrategy':
            return strategy.scheduleGroups.map(scheduleFromGroup);
        case 'CriteriaScheduleStrategy':
            return strategy.scheduleCriteria.map(scheduleFromGroup);
    }
}
function scheduleFromGroup(group) { 
    return group.schedule; 
}
function cloneSimpleStrategy(schedules) {
    return { type: 'SimpleScheduleStrategy', schedule: schedules[0] };
}
function cloneABTestStrategy(schedules) {
    return { type: 'ABTestScheduleStrategy',
        scheduleGroups: schedules.map(function(schedule) {
            return {percentage: 0, schedule: schedule};
        })
    };
}
function cloneCriteriaStrategy(schedules) {
    return { type: 'CriteriaScheduleStrategy',
        scheduleCriteria: schedules.map(function(schedule) {
            return {criteria: criteriaUtils.newCriteria(), schedule: schedule};
        })
    };
}
function newSchedule() {
    return {
        scheduleType: 'once', eventId:null, delay:null, interval:null,
        expires:null, cronTrigger:null, startsOn:null, endsOn:null, times:[],
        activities:[{label:'', labelDetail:'', activityType:'task', task:{identifier:''}}]
    };
}
function newSchedulePlan() {
    return {type: 'SchedulePlan', label: "", strategy: cloneSimpleStrategy([newSchedule()])};
}
function formatSchedule(sch) {
    if (!sch) {
        return "<i>No Schedule</i>";
    }
    var buffer = [];

    var initClause = "";
    var events = (sch.eventId) ? sch.eventId.split(",").reverse() : ["enrollment"];
    if (sch.delay) {
        initClause = periodToWords(sch.delay) + " after ";
    } else if (events[0] === "enrollment") {
        initClause = "upon ";
    }
    initClause += toList(events.map(function(event) {
        if (Object.keys(UNARY_EVENTS).indexOf(event) > -1) {
            return event.replace(/_/g, " ");
        }
        return formatEventId(event);
    }));
    // Capitalize first letter of phrase
    initClause = initClause.substring(0,1).toUpperCase() + initClause.substring(1);
    buffer.push(initClause);

    if (sch.scheduleType === "persistent") {
        var inner = [];
        formatActivitiesAvailable(inner, sch.activities);
        buffer.push("make " + inner.join(", ") + " permanently available to the user");
    } else {
        if (sch.scheduleType === "recurring") {
            // recurring schedules should have an interval, or a cron expression, but not both
            if (sch.interval && !sch.cronTrigger) {
                buffer.push("and every " + periodToWordsNoArticle(sch.interval) + " thereafter");
                if (sch.times && sch.times.length) {
                    buffer.push("at " + formatTimesArray(sch.times));
                }
            } else {
                buffer.push("and thereafter on the cron expression '"+sch.cronTrigger+"'");
            }
        }
        if (sch.activities && sch.activities.length) {
            formatActivities(buffer, sch.activities);
        }
    }
    var phrase = buffer.join(", ") + ".";
    if (sch.expires) {
        phrase += " Expire tasks after " + periodToWords(sch.expires) + ".";
    }
    if (sch.startsOn || sch.endsOn) {
        phrase += " Only schedule tasks ";
        if (sch.startsOn) {
            phrase += "after <span class='times-label'>" + new Date(sch.startsOn).toUTCString() + "</span>";
        }
        if (sch.startsOn && sch.endsOn) {
            phrase += " and ";
        }
        if (sch.endsOn) {
            phrase += "before <span class='times-label'>" + new Date(sch.endsOn).toUTCString() + "</span>";
        }
        phrase += ".";
    }
    return phrase.split(". ").map(function(sentence) {
        return sentenceCase(sentence);
    }).join(". ");
}
function formatStrategy(strategy) {
    if (strategy.type === 'SimpleScheduleStrategy') {
        return formatSchedule(strategy.schedule);
    } else if (strategy.type === 'ABTestScheduleStrategy') {
        return strategy.scheduleGroups.map(function (group) {
            return "<span class='times-label'>" + group.percentage + "%:</span> " +
                    formatSchedule(group.schedule);
        }).join('<br>');
    } else if (strategy.type === 'CriteriaScheduleStrategy') {
        return strategy.scheduleCriteria.map(function(group) {
            return "<span class='times-label'>"+criteriaUtils.label(group.criteria)+":</span> "+
                    formatSchedule(group.schedule);
        }).join('<br>');
    } else {
        return "<i>Unknown</i>";
    }
}
function formatScheduleStrategyType(type) {
    return TYPE_OPTIONS[type].label;
}
module.exports = {
    newSchedule: newSchedule,
    newSchedulePlan: newSchedulePlan,
    newStrategy: newStrategy,
    formatEventId: formatEventId,
    formatTimesArray: formatTimesArray,
    formatStrategy: formatStrategy,
    formatSchedule: formatSchedule,
    timeOptions: TIME_OPTIONS,
    formatScheduleStrategyType: formatScheduleStrategyType,
    timeOptionsLabel: utils.makeOptionLabelFinder(TIME_OPTIONS),
    timeOptionsFinder: utils.makeOptionFinder(TIME_OPTIONS),
    TYPE_OPTIONS: TYPE_OPTIONS,
    UNARY_EVENTS: UNARY_EVENTS,
    loadOptions: function() {
        var p1 = optionsService.getActivityOptions().then(activitiesObs);
        var p2 = optionsService.getSurveyOptions().then(surveysOptionsObs);
        return Promise.all([p1, p2]);
    }
};
