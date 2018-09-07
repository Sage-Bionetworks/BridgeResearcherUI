import fn from './functions';

const UNARY_LABELS = Object.freeze({
    /*'enrollment': 'enrollment',*/
    'activities_retrieved': 'activities first retrieved'
});
const PERIOD_WORDS = Object.freeze({
    'H': 'hour',
    'D': "day",
    'M': "month",
    'W': 'week',
    'Y': 'year'
});
const EMPTY = () => { 
    return ''; 
};
const TIME_OPTIONS = [];
for (let i=0; i < 24; i++) {
    let hour = (i === 0) ? 12 : (i > 12) ? i-12 : i;
    let hour24 = (i < 10) ? ("0"+i) : (""+i);
    let meridian = (i < 12) ? "AM" : "PM";
    TIME_OPTIONS.push({label: hour+":00 "+meridian,value: hour24+":00"});
    TIME_OPTIONS.push({label: hour+":30 "+meridian,value: hour24+":30"});
}
const TIME_FORMATTER = function(value) {
    let opt = TIME_OPTIONS.filter((opt) => {
        return opt.value === value;
    })[0];
    return (opt) ? opt.label : value;
};

function formatSchedule(schedule, activityFormatter = EMPTY, taskFormatter = EMPTY, surveyFormatter = EMPTY) {
    if (schedule == null || Object.keys(schedule).length === 0) {
        return "<i>No schedule</i>";
    }
    let buffer = [];

    let eventClause = (schedule.delay) ?
        (periodToWords(schedule.delay) + " after ") : "on ";
    eventClause += formatEventId(schedule.eventId, activityFormatter);
    buffer.push(eventClause);

    if (fn.is(schedule.activities, 'Array')) {
        let activityMap = formatActivities(schedule.activities, taskFormatter, surveyFormatter);
        let activitylabels = Object.keys(activityMap).map((activityLabel) => {
            let count = activityMap[activityLabel];

            if (schedule.scheduleType === 'persistent') {
                return pluralize(count, `make the ${activityLabel} permanently available`, 
                    ` to do ${count} times`);
            } else if (schedule.scheduleType === 'recurring') {
                let recurringString = '';
                if (schedule.cronTrigger) {
                    recurringString = `and thereafter on the cron expression '${schedule.cronTrigger}'`;
                } else {
                    recurringString = `and every ${periodToWordsNoArticle(schedule.interval)} `+
                        `thereafter at ${formatTimesArray(schedule.times)}`;
                }
                return pluralize(count, `${recurringString}, do ${activityLabel}`, ` ${count} times`);
            } else {
                return pluralize(count, `do ${activityLabel}`, ` ${count} times`);
            }
        });
        buffer.push(activitylabels.join(', '));
    }

    let phrase = buffer.join(', ') + ".";
    if (schedule.expires) {
        phrase = `${phrase} Expire tasks after ${periodToWords(schedule.expires)}.`;
    }
    if (schedule.sequencePeriod) {
        phrase = `${phrase} End this sequence of activities at ${periodToWords(schedule.sequencePeriod)}.`;
    }
    if (schedule.startsOn || schedule.endsOn) {
        let range = '';
        if (schedule.startsOn) {
            range = `after <span class='times-label'>${fn.formatDateTime(schedule.startsOn)}</span>`;
        }
        if (schedule.startsOn && schedule.endsOn) {
            range += " and ";
        }
        if (schedule.endsOn) {
            range += `before <span class='times-label'>${fn.formatDateTime(schedule.endsOn)}</span>`;
        }
        phrase = `${phrase} Only schedule tasks ${range}.`;
    }
    return phrase.split(". ").map(sentenceCase).join(". ");
}
function pluralize(count, string, postfix) {
    return (count > 1) ? (string + postfix) : string;
}
function formatTimesArray(times) {
    return (fn.is(times,'Array') && times.length) ? fn.formatList(times.map(formatTime)) : "<None>";
}
function formatTime(time) {
    time = time.replace(":00.000","");
    // If there's no label, it's an odd time. Just leave it for now.
    return TIME_FORMATTER(time) || time;
}
function formatEventId(eventId, activityFormatter) {
    // Still the server default if no eventId is provided. We now prefer activities_retrieved
    if (fn.isBlank(eventId)) {
        eventId = "enrollment";
    }
    let phrases = eventId.split(',').reverse().map((oneEventId) => {
        let [object, guid, eventType] = oneEventId.split(":");

        if (UNARY_LABELS[object]) {
            return UNARY_LABELS[object];
        } else if (object === 'custom') {
            return `when '${guid}' occurs`;
        } else if (object === 'activity') {
            let activityLabel = activityFormatter(guid);
            return `when activity '${activityLabel}' is ${eventType}`;
        } else {
            // there were others in the initial schedule event design, such as survey and question, 
            // that have not been supported and so are not formatted here.
            return oneEventId;
        }
    });
    return fn.formatList(phrases);
}
function periodToWords(periodStr) {
    let periods = parsePeriods(periodStr);
    return periods.map(function(period) {
        if (period.amt === 1 && period.measure === "H") {
            return `an ${period.measure}`;
        } else if (period.amt === 1) {
            return `a ${period.measure}`;
        }
        return `${period.amt} ${period.measure}s`;
    }).join(', ');
}
function parsePeriods(period) {
    let periods = period.substring(1).match(/(\d+\D)/g);
    return periods.map(function(period) {
        let amt = parseInt(period, 10);
        let measure = PERIOD_WORDS[period.replace(/[\d]*/, '')];
        return {amt: amt, measure: measure};
    });
}
function periodToWordsNoArticle(periodStr) {
    return parsePeriods(periodStr).map((period) => {
        return (period.amt === 1) ?
            `${period.amt} ${period.measure}` :
            `${period.amt} ${period.measure}s`;
    }).join(', ');
}
function formatActivities(activities, taskFormatter, surveyFormatter) {
    return activities.reduce((map, act) => {
        let label = 'task (not specified)';
        if (act.activityType === "task" && act.task) {
            label = `task '${taskFormatter(act.task.taskId || act.task.identifier)}'`;
        } else if (act.activityType === "survey" && act.survey) {
            label = `survey '${surveyFormatter(act.survey.guid)}'`;
        } else if (act.activityType === "compound" && act.compoundActivity) {
            label = `compound task '${act.compoundActivity.taskIdentifier}'`;
        }
        map[label] = ++map[label] || 1;
        return map;
    }, {});
}
function sentenceCase(string) {
    return string.substring(0,1).toUpperCase() + string.substring(1);
}

export default {
    formatEventId: fn.seq(formatEventId, sentenceCase),
    formatSchedule,
    formatTimesArray
};