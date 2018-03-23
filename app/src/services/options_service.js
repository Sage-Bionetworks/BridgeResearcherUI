import {serverService} from './server_service';
import fn from '../functions';

const LABEL_SORTER = fn.makeFieldSorter('label');

function getSchedule(group) {
    return group.schedule;
}
function getSchedules(plan) {
    switch(plan.strategy.type) {
        case 'SimpleScheduleStrategy':
            return [plan.strategy.schedule];
        case 'ABTestScheduleStrategy':
            return plan.strategy.scheduleGroups.map(getSchedule);
        case 'CriteriaScheduleStrategy':
            return plan.strategy.scheduleCriteria.map(getSchedule);
    }
}
function getActivityOptions() {
    return serverService.getSchedulePlans().then(function(response) {
        let activities = [];
        response.items.forEach(function(plan) {
            let schedules = getSchedules(plan);
            schedules.forEach(function(schedule) {
                let multi = schedule.activities.length > 1;
                schedule.activities.forEach(function(activity, i) {
                    let actLabel = (multi) ? 
                        (activity.label + " ("+plan.label+" activity #"+(i+1)+")") : activity.label; 
                    activities.push({label: actLabel, "value": activity.guid});
                });
            });
        }, []);
        return activities.sort(LABEL_SORTER);
    });
}
function getSurveyOptions() {
    return serverService.getPublishedSurveys()
        .then(fn.handleSort('items', 'name'))
        .then(collectSurveyOptions);
}
function collectSurveyOptions(surveys) {
    let surveyOpts = surveys.items.map(function(survey) {
        return { label: survey.name, value: survey.guid };
    });
    return [{value:"",label:"Select survey:"}].concat(surveyOpts);
}
function getTaskIdentifierOptions() {
    return serverService.getStudy().then(function(study) {
        let taskOpts = study.taskIdentifiers.map(function(id) {
            return { label:id, value:id };
        });
        return [{value:"",label:"Select task:"}].concat(taskOpts);
    });
}
function getActivities(plan) {
    return getSchedules(plan).reduce(function(array, schedule) {
        return [].concat(schedule.activities);
    }, []);
}
function getCompoundActivityOptions() {
    return serverService.getTaskDefinitions().then(function(response) {
        let opts = response.items.map(function(task) {
            return {label: task.taskId, value: task.taskId};
        });
        return [{value:"",label:"Select compound task:"}].concat(opts);
    });
}
export default {
    getActivities,
    getSchedules,
    getActivityOptions,
    getSurveyOptions,
    getTaskIdentifierOptions,
    getCompoundActivityOptions
};