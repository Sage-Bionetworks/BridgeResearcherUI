import {serverService} from '../../services/server_service';
import criteriaUtils from '../../criteria_utils';
import fn from '../../functions';
import ko from 'knockout';
import optionsService from '../../services/options_service';
import Promise from 'bluebird';
import utils from '../../utils';

// This is duplicated in sharedModuleUtils.
const surveyNameMap = {};

const activitiesObs = ko.observableArray([]);
const activityOptionsLabel = utils.makeOptionLabelFinder(activitiesObs);

const surveysOptionsObs = ko.observableArray([]);
const surveysOptionsLabel = utils.makeOptionLabelFinder(surveysOptionsObs);

const questionsOptionsObs = ko.observableArray([]);
const questionsOptionsLabel = utils.makeOptionLabelFinder(questionsOptionsObs);

const taskOptionsObs = ko.observableArray([]);
const taskOptionsLabel = utils.makeOptionLabelFinder(taskOptionsObs);

const compoundActivityOptionsObs = ko.observableArray([]);

const TYPE_OPTIONS = Object.freeze([
    {value: 'SimpleScheduleStrategy', label: 'Simple Schedule'},
    {value: 'ABTestScheduleStrategy', label: 'A/B Test Schedule'},
    {value: 'CriteriaScheduleStrategy', label: 'Criteria-based Schedule'}
]);

const PERIOD_WORDS = Object.freeze({
    'H': 'hour',
    'D': "day",
    'M': "month",
    'W': 'week',
    'Y': 'year'
});

const UNARY_EVENTS = Object.freeze({
    'enrollment': 'On enrollment',
    'two_weeks_before_enrollment': 'Two weeks before enrollment',
    'two_months_before_enrollment': 'Two months before enrollment'
});

const TIME_OPTIONS = [];
const timeFormatter = utils.makeOptionLabelFinder(TIME_OPTIONS);

for (let i=0; i < 24; i++) {
    let hour = (i === 0) ? 12 : (i > 12) ? i-12 : i;
    let hour24 = (i < 10) ? ("0"+i) : (""+i);
    let meridian = (i < 12) ? "AM" : "PM";
    TIME_OPTIONS.push({label: hour+":00 "+meridian,value: hour24+":00"});
    TIME_OPTIONS.push({label: hour+":30 "+meridian,value: hour24+":30"});
}

function formatEventId(value) {
    if (!value) {
        return "On enrollment (default)";
    }
    let elements = value.split(',').reverse().map(function(value) {
        if (UNARY_EVENTS[value]) {
            return UNARY_EVENTS[value];
        } else if (value.indexOf("custom:") > -1) {
            return "when "+ value.split(":")[1] + " occurs";
        }
        // events have three parts, e.g. survey:<guid>:finished
        let parts = value.split(":");
        if (parts[0] === "survey") {
            let surveyLabel = surveysOptionsLabel(parts[1]);
            return "when survey '"+surveyLabel+"' is finished";
        } else if (parts[0] === "question") {
            let questionLabel = questionsOptionsLabel(parts[1]);
            let answerValue = parts[2].split("=")[1];
            return "when question '"+questionLabel+"' is answered with value '"+answerValue+"'";
        } else if (parts[0] === "activity") {
            let activityLabel = activityOptionsLabel(parts[1]);
            return "when activity '"+activityLabel+"' is finished";
        }
        return " " + value;
    });
    return fn.formatList(elements);
}
function formatTime(time) {
    time = time.replace(":00.000","");
    // If there's no label, it's an odd time. Just leave it for now.
    return timeFormatter(time) || time;
}
function formatTimesArray(times) {
    return (fn.is(times,'Array') && times.length) ? fn.formatList(times.map(formatTime)) : "<None>";
}
function formatActivities(buffer, activities, verb) {
    let actMap = {};
    activities.map(function(act) {
        let label = verb + ' task (not specified)';

        // This may be way too complicated, it still does not show the underlying *real* name
        // of the thing being linked to in the schedule
        if (act.activityType === "task" && act.task) {
            label = verb + " task '"+taskOptionsLabel(act.task.taskId || act.task.identifier)+"'";
        } else if (act.activityType === "survey" && act.survey) {
            label = verb + " survey '"+surveysOptionsLabel(act.survey.guid)+"'";
        } else if (act.activityType === "compound" && act.compoundActivity) {
            label = verb + " compound task '"+act.compoundActivity.taskIdentifier+"'";
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
    let periods = period.substring(1).match(/(\d+\D)/g);
    return periods.map(function(period) {
        let amt = parseInt(period, 10);
        let measure = PERIOD_WORDS[period.replace(/[\d]*/, '')];
        return {amt: amt, measure: measure};
    });
}
function periodToWords(periodStr) {
    let periods = parsePeriods(periodStr);
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
    let periods = parsePeriods(periodStr);
    return periods.map(function(period) {
        return (period.amt === 1) ?
            (period.amt + " " + period.measure) :
            (period.amt + " " + period.measure+"s");
    }).join(', ');
}
function newStrategy(type, existingStrategy) {
    let schedules = (existingStrategy) ? extractSchedules(existingStrategy) : [newSchedule()];
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
function formatEventElement(event) {
    if (Object.keys(UNARY_EVENTS).indexOf(event) > -1) {
        return event.replace(/_/g, " ");
    }
    return formatEventId(event);
}
function formatSchedule(sch) {
    if (!sch) {
        return "<i>No Schedule</i>";
    }
    let buffer = [];

    let events = (sch.eventId) ? sch.eventId.split(",").reverse() : ["enrollment"];
    let eventClause = "";
    if (sch.delay) {
        eventClause = periodToWords(sch.delay) + " after ";
    } else if (events[0] === "enrollment") {
        eventClause = "upon ";
    }
    eventClause += fn.formatList(events.map(formatEventElement));
    buffer.push(eventClause);

    if (sch.scheduleType === "persistent") {
        let inner = [];
        formatActivities(inner, sch.activities, "the");
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
            formatActivities(buffer, sch.activities, "do");
        }
    }
    let phrase = buffer.join(", ") + ".";
    if (sch.expires) {
        phrase += " Expire tasks after " + periodToWords(sch.expires) + ".";
    }
    if (sch.sequencePeriod) {
        phrase += " End this sequence of tasks at " + periodToWords(sch.sequencePeriod) + ".";
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
function formatCompoundActivity(task) {
    let phrase = [];
    let schemas = (task.schemaList || task.schemaReferences).map(function(schema) {
        return schema.id + ((schema.revision) ? 
            ' <i>(rev. ' + schema.revision + ')</i>' : '');
    }).join(', ');
    if (schemas) {
        phrase.push(schemas);
    }
    let surveys = (task.surveyList || task.surveyReferences).map(function(survey) {
        return surveyNameMap[survey.guid] + ((survey.createdOn) ? 
            ' <i>(pub. ' + fn.formatDateTime(survey.createdOn) + ')</i>' : '');
    }).join(', ');
    if (surveys) {
        phrase.push(surveys);
    }
    return phrase.join('; ');
}
function loadFormatCompoundActivity() {
    return serverService.getSurveys().then(function(response) {
        response.items.forEach(function(survey) {
            surveyNameMap[survey.guid] = survey.name;
        });
    });
}
function getActivitiesWithStrategyInfo(plan) {
    let activities = [];
    switch(plan.strategy.type) {
        case 'SimpleScheduleStrategy':
            plan.strategy.schedule.activities.forEach(function(activity) {
                activities.push({
                    plan: plan.label,
                    planGuid: plan.guid,
                    label: activity.label, 
                    qualifier: "",
                    guid: activity.guid
                });
            });
            break;
        case 'ABTestScheduleStrategy':
            plan.strategy.scheduleGroups.forEach(function(group, index) {
                group.activities.forEach(function(activity) {
                    activities.push({
                        plan: plan.label,
                        planGuid: plan.guid,
                        label: activity.label,
                        qualifier: "Group #"+index,
                        guid: activity.guid
                    });
                });
            });
            break;
        case 'CriteriaScheduleStrategy':
            plan.strategy.scheduleCriteria.forEach(function(group) {
                group.schedule.activities.forEach(function(activity) {
                    let critLabel = criteriaUtils.label(group.criteria);
                    activities.push({
                        plan: plan.label,
                        planGuid: plan.guid,
                        label: activity.label,
                        qualifier: critLabel,
                        guid: activity.guid
                    });
                });
            });
            break;
    }
    return activities;
}
export default {
    newSchedule,
    newSchedulePlan,
    newStrategy,
    formatEventId: fn.seq(formatEventId, sentenceCase),
    formatTimesArray,
    formatStrategy,
    formatSchedule,
    formatCompoundActivity,
    timeOptions: TIME_OPTIONS,
    timeOptionsLabel: utils.makeOptionLabelFinder(TIME_OPTIONS),
    formatScheduleStrategyType,
    timeOptionsFinder: utils.makeOptionFinder(TIME_OPTIONS),
    activitiesObs,
    surveysOptionsObs,
    taskOptionsObs,
    compoundActivityOptionsObs,
    getActivitiesWithStrategyInfo,
    TYPE_OPTIONS,
    UNARY_EVENTS,
    loadOptions: function() {
        let p1 = optionsService.getActivityOptions().then(activitiesObs);
        let p2 = optionsService.getSurveyOptions().then(surveysOptionsObs);
        let p3 = optionsService.getTaskIdentifierOptions().then(taskOptionsObs);
        let p4 = loadFormatCompoundActivity();
        let p5 = optionsService.getCompoundActivityOptions().then(compoundActivityOptionsObs);
        return Promise.all([p1, p2, p3, p4, p5]);
    }
};
export { UNARY_EVENTS };