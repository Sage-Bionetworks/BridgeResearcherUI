import fn from './functions';

const UNARY_EVENTS = Object.freeze({
    'enrollment': 'On enrollment',
    'activities_retrieved': 'On activities first retrieved'
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
const TIME_OPTIONS = (function() {
    let array = [];
    for (let i=0; i < 24; i++) {
        let hour = (i === 0) ? 12 : (i > 12) ? i-12 : i;
        let hour24 = (i < 10) ? ("0"+i) : (""+i);
        let meridian = (i < 12) ? "AM" : "PM";
        array.push({ label: hour+":00 "+meridian, value: hour24+":00" });
        array.push({ label: hour+":30 "+meridian, value: hour24+":30" });
    }
    return array;
}());
const TIME_LABEL_FINDER = makeOptionLabelFinder(TIME_OPTIONS);
const TIME_OPTION_FINDER = makeOptionFinder(TIME_OPTIONS);

// I'm not sure these need to be knockout observables in schedule_utils, and as a result, I've brought in 
// a dependency that makes testing more difficult
function makeOptionFinder(array) {
    return function(value) {
        for (let i= 0; i < array.length; i++) {
            let option = array[i];
            if (option.value === value) {
                return option;
            }
        }
    };
}
function makeOptionLabelFinder(array) {
    let finder = makeOptionFinder(array);
    return function(value) {
        let option = finder(value);
        return option ? option.label : "";
    };
}

function formatSchedule(schedule, activityFormatter = EMPTY, taskFormatter = EMPTY, surveyFormatter = EMPTY) {
    if (schedule == null || Object.keys(schedule).length === 0) {
        return "<i>No schedule</i>";
    }

    let eventClause = (schedule.delay) ?
        `${periodToWords(schedule.delay)} after ${formatEventId(schedule.eventId, activityFormatter)}` :
        `on ${formatEventId(schedule.eventId, activityFormatter)}`;

    let phrase = [eventClause];

    if (fn.is(schedule.activities, 'Array')) {
        let activityMap = mapActivityCounts(schedule.activities, taskFormatter, surveyFormatter);
        phrase.push( formatActivityArray(activityMap, schedule) );
    }

    let buffer = [phrase.join(", ")];

    if (schedule.expires) {
        buffer.push(`Expire activity after ${periodToWords(schedule.expires)}`);
    }
    if (schedule.sequencePeriod) {
        buffer.push(`End this sequence of activities at ${periodToWords(schedule.sequencePeriod)}`);
    }
    if (schedule.startsOn || schedule.endsOn) {
        buffer.push(formatTimeWindow(schedule));
    }
    return buffer.map(sentenceCase).join(". ") + ".";
}
function formatActivityArray(activityMap, schedule) {
    if (schedule.scheduleType === 'persistent') {
        return formatActivityPhrase(activityMap, 
            '#{label}', 
            ' (to do #{count} times)', 
            'make the #{list} permanently available');
    } else if (schedule.scheduleType === 'recurring') {
        if (schedule.cronTrigger) {
            return formatActivityPhrase(activityMap, 
                'do #{label}', 
                ' #{count} times', 
                `and thereafter on the cron expression '${schedule.cronTrigger}', #{list}`);
        } else {
            let periodString = periodToWordsNoArticle(schedule.interval);
            let timeString = formatTimesArray(schedule.times);
            return formatActivityPhrase(activityMap, 
                'do #{label}', 
                ' #{count} times', 
                `and every ${periodString} thereafter at ${timeString}, #{list}`);
        }
    } else if (schedule.scheduleType === 'once') {
        return formatActivityPhrase(activityMap, 
            'do #{label}', 
            ' #{count} times', 
            `#{list}`);
    }
    return formatActivityPhrase(activityMap, 
        'do #{label}', 
        ' #{count} times', 
        `#{list} at ${formatTimesArray(schedule.times)}`);
}
function formatActivityPhrase(activityMap, activityLabel, pluralLabel, phrase) {
    let activityPhrase = Object.keys(activityMap).map((label) => {
        let count = activityMap[label];
        return pluralize(count, activityLabel.replace('#{label}', label), pluralLabel.replace('#{count}', count));
    });
    return phrase.replace('#{list}', fn.formatList(activityPhrase));
}
function pluralize(count, string, postfix) {
    return (count > 1) ? (string + postfix) : string;
}
function formatTimeWindow(schedule) {
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
    return `Only schedule activities ${range}`;
}
function formatTimesArray(times) {
    return (fn.is(times,'Array') && times.length) ? fn.formatList(times.map(formatTime)) : "<None>";
}
function formatTime(time) {
    time = time.replace(":00.000","");
    // If there's no label, it's an odd time. Just leave it for now.
    return TIME_LABEL_FINDER(time) || time;
}
function formatEventId(eventId, activityFormatter) {
    // Still the server default if no eventId is provided. We now prefer activities_retrieved
    if (fn.isBlank(eventId)) {
        eventId = "enrollment";
    }
    let phrases = eventId.split(',').reverse().map((oneEventId) => {
        let [object, guid, eventType] = oneEventId.split(":");

        if (UNARY_EVENTS[object]) {
            // Remove "On " from the string
            return UNARY_EVENTS[object].replace(/^On\s/,"");
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
function mapActivityCounts(activities, taskFormatter, surveyFormatter) {
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
    formatTimesArray,
    timeOptions: TIME_OPTIONS,
    timeOptionsLabel: TIME_LABEL_FINDER,
    timeOptionsFinder: TIME_OPTION_FINDER
};
export { UNARY_EVENTS };