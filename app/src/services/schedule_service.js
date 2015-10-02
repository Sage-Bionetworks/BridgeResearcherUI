var ko = require('knockout');
var surveyUtils = require('../pages/survey/survey_utils');
var utils = require('../utils');

var PERIOD_WORDS = {
    'H': 'hour',
    'D': 'day',
    'M': "month",
    'W': 'week'
}

var TIME_OPTIONS = [];
var MINUTES = ["00","30"];
var timeFormatter = utils.makeOptionLabelFinder(TIME_OPTIONS);
for (var i=0; i < 24; i++) {
    var hour = (i === 0) ? 12 : (i > 12) ? i-12 : i;
    var hour24 = (i < 10) ? ("0"+i) : (""+i);
    var meridian = (i < 12) ? "AM" : "PM";

    MINUTES.forEach(function(min) {
        TIME_OPTIONS.push({
            label: hour+":"+min+" "+meridian,
            value: hour24+":"+min
        });
    });
}
function formatEventId(value) {
    if (!value) {
        return "On enrollment (default)";
    }
    var string = value.split(',').reverse().map(function(value) {
        if (value === "enrollment") {
            return "on enrollment";
        }
        // events have three parts, e.g. survey:<guid>:finished
        var parts = value.split(":");
        if (parts[0] === "survey") {
            var surveyLabel = surveyUtils.surveysOptionsLabel(parts[1]);
            return "when survey '"+surveyLabel+"' is finished";
        } else if (parts[0] === "question") {
            var questionLabel = surveyUtils.questionsOptionsLabel(parts[1]);
            var answerValue = parts[2].split("=")[1];
            return "when question '"+questionLabel+"' is answered with value '"+answerValue+"'";
        }
    }).join(', and ');

    return string.charAt(0).toUpperCase() + string.substring(1);
}
function formatTimesArray(times) {
    return (times && times.length) ? toList(times.map(function(time) {
        time = time.replace(":00.000","");
        // If there's no label, it's an odd time. Just leave it for now.
        return timeFormatter(time) || time;
    })) : "<None>";
}
function formatActivities(buffer, activities) {
    activities.map(function(act) {
        if (act.activityType === "task" && act.task) {
            return buffer.push("do task '"+act.task.identifier+"'");
        } else if (act.activityType === "survey" && act.survey) {
            return buffer.push("do task '"+act.survey.identifier+"'");

        }
        buffer.push('do task (not specified)');
    });
}
function sentenceCase(string) {
    return string.substring(0,1).toUpperCase() + string.substring(1);
}
function parsePeriod(period) {
    var parts = period.substring(1).split("T");
    var duration = (parts.length === 2) ? parts[1] : parts[0];
    return {
        amt: parseInt(duration, 10),
        measure: PERIOD_WORDS[duration.replace(/[\d]*/,'')]
    };
}
function formatPeriod(amt, measure) {
    if (amt === 1 && measure == "H") {
        return "an " + measure;
    } else if (amt === 1) {
        return "a " + measure;
    }
    return amt + " " + measure + "s";
}
function periodToWords(periodStr) {
    var period = parsePeriod(periodStr);
    if (period.amt === 1 && period.measure === "H") {
        return "an " + period.measure;
    } else if (period.amt === 1) {
        return "a " + period.measure;
    }
    return period.amt + " " + period.measure + "s";
}
function periodToWordsNoArticle(periodStr) {
    var period = parsePeriod(periodStr);
    return (period.amt === 1) ? (period.amt + " " + period.measure) : (period.amt + " " + period.measure+"s");
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
function newSimpleStrategy() {
    return { schedule: newSchedule(), type: 'SimpleScheduleStrategy' };
}
function newABTestStrategy() {
    return { scheduleGroups: [], type: 'ABTestScheduleStrategy' };
}
function newSchedule() {
    return {
        scheduleType: 'once', eventId:null, delay:null, interval:null,
        expires:null, cronTrigger:null, startsOn:null, endsOn:null, times:[],
        activities:[{label:'', labelDetail:'', activityType:'task', task:{identifier:''}}]
    };
}
function formatSchedule(sch) {
    if (!sch) {
        return "<i>No Schedule</i>";
    }
    var buffer = [];

    if (sch.activities && sch.activities.length > 1) {
        buffer.push("schedule " + sch.activities.length + " tasks");
    }
    var initClause = "";
    if (sch.delay) {
        initClause = periodToWords(sch.delay) + " after ";
    } else {
        initClause = "upon ";
    }
    var events = (sch.eventId) ? sch.eventId.split(",").reverse() : ["enrollment"];
    initClause += toList(events.map(function(event) {
        return (event === "enrollment") ? "enrollment" : formatEventId(event).toLowerCase();
    }));
    buffer.push(initClause);
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
        return strategy.scheduleGroups.map(function(group) {
            return "<span class='times-label'>" + group.percentage + "%:</span> " +
                    formatSchedule(group.schedule);
        }).join('<br>');
    } else {
        return "<i>Unknown</i>";
    }
}

module.exports = {
    newSchedule: newSchedule,
    newSimpleStrategy: newSimpleStrategy,
    newABTestStrategy: newABTestStrategy,
    formatEventId: formatEventId,
    formatTimesArray: formatTimesArray,
    formatStrategy: formatStrategy,
    timeOptions: TIME_OPTIONS,
    timeOptionsLabel: utils.makeOptionLabelFinder(TIME_OPTIONS),
    timeOptionsFinder: utils.makeOptionFinder(TIME_OPTIONS)
};
