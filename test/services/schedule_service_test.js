var assert = require("assert");
var proxyquire = require('proxyquire').noCallThru();
/*
var serverServiceStub = {};

var scheduleService = proxyquire('./../../schedule_service', {
    path: {
        './server_service': serverServiceStub
    }
});

function getStrategy() {
    return {
        "type": "SimpleScheduleStrategy",
        "schedule": {
            "label": "Label for schedule",
            "scheduleType": "recurring",
            "cronTrigger": "0 0 8 ? * TUE *",
            "eventId": "enrollment",
            "activities": [getActivity()],
            "times": ["10:10:00.000", "14:00:00.000"],
            "startsOn": "2015-02-02T10:10:10.000Z",
            "endsOn": "2015-01-01T10:10:10.000Z",
            "expires": "P2D",
            "delay": "P1D",
            "interval": "P3D"
        }
    };
}
function getActivity() {
    return {"label": "Take the Tapping Test", "labelDetail": "10 minutes", "task": {"identifier":"tapping-test"}, "activityType": "task"}
}
describe('Schedule', function() {
    // all three of the above with a delay
    // all three with a different event than 'enrollment'

    it('silently skips over missing information', function() {
        var strategy = {};

        var str = scheduleService.formatStrategy(strategy);
        assert.equal("<i>Unknown</i>", str);

        strategy = {'type':'SimpleScheduleStrategy'};
        str = scheduleService.formatStrategy(strategy);
        assert.equal("<i>No Schedule</i>", str);

        // This really doesn't mean anything, there's no activity
        strategy = {'type':'SimpleScheduleStrategy','schedule':{}};
        str = scheduleService.formatStrategy(strategy);
        assert.equal("Upon enrollment.", str);

        strategy = {'type':'SimpleScheduleStrategy','schedule':{activities: [{"label": "Take the Tapping Test", "labelDetail": "10 minutes", "task": {"identifier":"tapping-test"}, "activityType": "task"}]}};
        str = scheduleService.formatStrategy(strategy);
        assert.equal("Upon enrollment, do task 'tapping-test'.", str);

    });
    it('silently skips over missing activity information', function() {
        var strategy = getStrategy();
        delete strategy.schedule.activities[0].task;
        delete strategy.schedule.startsOn;
        delete strategy.schedule.endsOn;

        var str = scheduleService.formatStrategy(strategy);
        assert.equal("A day after enrollment, and thereafter on the cron expression '0 0 8 ? * TUE *', do task (not specified). Expire tasks after 2 days.", str);
    });
    it('displays a repeating interval schedule', function() {
        var strategy = getStrategy();
        delete strategy.schedule.cronTrigger;
        strategy.schedule.interval = "P3D";

        var str = scheduleService.formatStrategy(strategy);
        assert.equal("A day after enrollment, and every 3 days thereafter, at 10:10 and 2:00 PM, do task 'tapping-test'. Expire tasks after 2 days. Only schedule tasks after <span class='times-label'>Mon, 02 Feb 2015 10:10:10 GMT</span> and before <span class='times-label'>Thu, 01 Jan 2015 10:10:10 GMT</span>.", str);
    });
    it('displays a repeating cron schedule', function() {
        var strategy = getStrategy();
        delete strategy.schedule.expires; // Not legal, but still needs to be formatted while editing
        delete strategy.schedule.startsOn;
        delete strategy.schedule.endsOn;

        var str = scheduleService.formatStrategy(strategy);
        assert.equal("A day after enrollment, and thereafter on the cron expression '0 0 8 ? * TUE *', do task 'tapping-test'.", str);
    });
    it('displays one time schedule', function() {
        var strategy = getStrategy();
        strategy.schedule.scheduleType = "once";

        var str = scheduleService.formatStrategy(strategy);
        assert.equal("A day after enrollment, do task 'tapping-test'. Expire tasks after 2 days. Only schedule tasks after <span class='times-label'>Mon, 02 Feb 2015 10:10:10 GMT</span> and before <span class='times-label'>Thu, 01 Jan 2015 10:10:10 GMT</span>.", str);
    });
    it('displays repeating task with delay', function() {
        var strategy = getStrategy();
        strategy.schedule.scheduleType = "recurring";
        delete strategy.schedule.cronTrigger;
        strategy.schedule.interval = "P3D";
        strategy.schedule.delay = "PT6H";
        delete strategy.schedule.startsOn;
        delete strategy.schedule.endsOn;
        delete strategy.schedule.expires;

        var str = scheduleService.formatStrategy(strategy);
        assert.equal("6 hours after enrollment, and every 3 days thereafter, at 10:10 and 2:00 PM, do task 'tapping-test'.", str);
    });
    it('displays repeating task with delay and multiple events', function() {
        var strategy = getStrategy();
        strategy.schedule.scheduleType = "recurring";
        delete strategy.schedule.cronTrigger;
        strategy.schedule.interval = "P3D";
        strategy.schedule.delay = "PT6H";
        strategy.schedule.eventId = "survey:foo:finished,enrollment";
        delete strategy.schedule.startsOn;
        delete strategy.schedule.endsOn;
        delete strategy.schedule.expires;

        var str = scheduleService.formatStrategy(strategy);
        assert.equal("6 hours after enrollment and when survey '' is finished, and every 3 days thereafter, at 10:10 and 2:00 PM, do task 'tapping-test'.", str);
    });
});
*/