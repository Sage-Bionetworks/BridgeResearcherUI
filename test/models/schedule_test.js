var assert = require("assert");
var Schedule = require('../../app/src/models/schedule');

function jsonFactory() {
    return {
        "label":"Label for schedule",
        "scheduleType":"recurring",
        "cronTrigger":"0 0 8 ? * TUE *",
        "eventId":"eventId",
        "activities":[{"label":"Take the Tapping Test", "ref":"http://ref/", "activityType":"task"}],
        "times":["10:10:00.000","14:00:00.000"],
        "startsOn":"2015-02-02T10:10:10.000Z",
        "endsOn":"2015-01-01T10:10:10.000Z",
        "expires":"P2D",
        "delay":"P1D",
        "interval":"P3D"
    };
}

describe('Schedule', function() {
    // repeat with cron
    // repeat with interval
    // one-time
    // all three of the above with a delay
    // all three with a different event than 'enrollment'

    it('should show a readable explanation of a repeating schedule', function() {
        var schedule = new Schedule(jsonFactory());
        // TODO: This fails due to time zone adjustment for the user.
        assert.equal("Label for schedule (After a day, and every 3 days thereafter, at 10AM and 2PM, take the tapping test. If not done after 2 days, remove the task. Only schedule tasks after Mon, 02 Feb 2015 10:10:10 GMT and before Thu, 01 Jan 2015 10:10:10 GMT.)", schedule.toString());
    });
    it('should show a readable explanation of a one-time schedule', function() {
        var schedule = new Schedule(jsonFactory());
        // TODO: This fails due to time zone adjustment for the user.
        assert.equal("Label for schedule (After a day, and every 3 days thereafter, at 10AM and 2PM, take the tapping test. If not done after 2 days, remove the task. Only schedule tasks after Mon, 02 Feb 2015 10:10:10 GMT and before Thu, 01 Jan 2015 10:10:10 GMT.)", schedule.toString());
    });
    it('should expose dates as dates', function() {
        var schedule = new Schedule(jsonFactory());
        assert.equal(new Date("2015-02-02T10:10:10.000Z").getTime(), schedule.startsOn.getTime());
        assert.equal(new Date("2015-01-01T10:10:10.000Z").getTime(), schedule.endsOn.getTime());

        var json = jsonFactory();
        delete json.startsOn;
        delete json.endsOn;

        schedule = new Schedule(json);
        assert(schedule.startsOn === null);
        assert(schedule.endsOn === null);
    });
});
