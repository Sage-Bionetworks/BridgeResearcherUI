var moment = require('moment');

/**
 * An object that augments schedule json, particularly to describe it.
 * Schedules have labels but practically it would seem better to describe
 * the schedule itself in many contexts, but we'll see.
 * @param json
 * @constructor
 */
function periodToWords(period) {
    return moment.duration(period).humanize();
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
        arr[arr.length-1] = "and " + arr[arr.length-1];
        return arr.join(", ");
    }
}

function Schedule(json) {
    this.data = json;
    this.startsOn = (json.startsOn) ? new Date(json.startsOn) : null;
    this.endsOn = (json.endsOn) ? new Date(json.endsOn) : null;
}
Schedule.prototype = {
    toString: function() {
        var string = this.data.label + " (";
        var array = [];
        if (this.data.delay) {
            array.push("After " + periodToWords(this.data.delay));
        } else {
            array.push("Upon enrollment");
        }
        if (this.data.scheduleType === "recurring") {
            // recurring schedules should have an interval, or a cron expression, but not both
            if (this.data.interval) {
                array.push("and every " + periodToWords(this.data.interval) + " thereafter");
            } else {
                array.push("and thereafter on the cron expression '"+this.data.cronTrigger+"'");
            }
        }
        if (this.data.times) {
            array.push("at " + toList(this.data.times.map(function(time) {
                return moment("2015-01-01T"+time).format("hA");
            })));
        }
        array.push(toList(this.data.activities.map(function(activity) {
            return activity.label.toLowerCase();
        })));
        string += array.join(", ") + ".";
        if (this.data.expires) {
            string += " If not done after " + periodToWords(this.data.expires) + ", remove the task.";
        }
        if (this.startsOn || this.endsOn) {
            string += " Only schedule tasks ";
            if (this.startsOn) {
                string += "after " + this.startsOn.toUTCString();
            }
            if (this.startsOn || this.endsOn) {
                string += " and ";
            }
            if (this.endsOn) {
                string += "before " + this.endsOn.toUTCString();
            }
            string += ".";
        }
        return string + ")";
    }
};

module.exports = Schedule;
