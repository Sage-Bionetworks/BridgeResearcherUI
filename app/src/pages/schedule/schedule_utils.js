import {serverService} from '../../services/server_service';
import criteriaUtils from '../../criteria_utils';
import fn from '../../functions';
import ko from 'knockout';
import optionsService from '../../services/options_service';
import Promise from 'bluebird';
import utils from '../../utils';

import scheduleFormatter from '../../schedule_formatter';

// This is duplicated in sharedModuleUtils.
const surveyNameMap = {};

const activitiesObs = ko.observableArray([]);
const activityOptionsLabel = utils.makeOptionLabelFinder(activitiesObs);

const surveysOptionsObs = ko.observableArray([]);
const surveysOptionsLabel = utils.makeOptionLabelFinder(surveysOptionsObs);

const taskOptionsObs = ko.observableArray([]);
const taskOptionsLabel = utils.makeOptionLabelFinder(taskOptionsObs);

const compoundActivityOptionsObs = ko.observableArray([]);

const TYPE_OPTIONS = Object.freeze([
    {value: 'SimpleScheduleStrategy', label: 'Simple Schedule'},
    {value: 'ABTestScheduleStrategy', label: 'A/B Test Schedule'},
    {value: 'CriteriaScheduleStrategy', label: 'Criteria-based Schedule'}
]);

const UNARY_EVENTS = Object.freeze({
    'enrollment': 'On enrollment',
    'activities_retrieved': 'On first retrieving activities'
});

const TIME_OPTIONS = [];
for (let i=0; i < 24; i++) {
    let hour = (i === 0) ? 12 : (i > 12) ? i-12 : i;
    let hour24 = (i < 10) ? ("0"+i) : (""+i);
    let meridian = (i < 12) ? "AM" : "PM";
    TIME_OPTIONS.push({label: hour+":00 "+meridian,value: hour24+":00"});
    TIME_OPTIONS.push({label: hour+":30 "+meridian,value: hour24+":30"});
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
function formatSchedule(sch) {
    return scheduleFormatter.formatSchedule(sch, activityOptionsLabel, taskOptionsLabel, surveysOptionsLabel);
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
        return (schema.revision) ? `${schema.id} <i>(rev. ${schema.revision})</i>`: schema.id;
    }).join(', ');
    if (schemas) {
        phrase.push(schemas);
    }
    let surveys = (task.surveyList || task.surveyReferences).map(function(survey) {
        let surveyName = surveyNameMap[survey.guid];
        return (survey.createdOn) ? 
            `${surveyName} <i>(pub. ${fn.formatDateTime(survey.createdOn)})</i>` : surveyName;
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