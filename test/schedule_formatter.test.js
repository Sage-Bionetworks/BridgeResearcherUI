import fmt from '../app/src/schedule_formatter.js';
import { expect } from 'chai';

const ACTIVITY_FORMATTER = (guid) => {
    return (guid === '1c0cba59-cb9f-4244-ba2f-f95ee8760794') ? 'activity1' : 'ERROR'; 
};
const TASK_FORMATTER = (id) => {
    return (id === '4-APHTimedWalking-80F09109-265A-49C6-9C5D-765E49AAF5D9') ? 'Timed Walk' : 'ERROR';
};
const SURVEY_FORMATTER = (guid) => {
    return (guid === '46ca2bd1-4ca8-41de-b09a-b9ada80f682a') ? 'My Thoughts' : 'ERROR';
};
describe("formatSchedule", () => {
    it("handles null", () => {
        expect(fmt.formatSchedule(null)).to.equals("<i>No schedule</i>");
    });
    it("handles empty", () => {
        expect(fmt.formatSchedule({})).to.equals("<i>No schedule</i>");
    });
    describe("eventId formatting", () => {
        it("formats default eventId", () => {
            expect(fmt.formatSchedule({eventId:''})).to.equal("On enrollment.");
        });
        it("formats unary 'enrollment' event ID", () => {
            expect(fmt.formatSchedule({eventId:'enrollment'})).to.equal("On enrollment.");
        });
        it("formats unary 'activities_retrieved' event ID", () => {
            expect(fmt.formatSchedule({eventId:'activities_retrieved'})).to.equal("On activities first retrieved.");
        });
        it("formats a compound event ID with custom events", () => {
            let eventId = "custom:activityBurst2Start,custom:activityBurst3Start,custom:activityBurst4Start,activities_retrieved";
            expect(fmt.formatSchedule({eventId})).to.equal("On activities first retrieved, when 'activityBurst4Start' occurs, when 'activityBurst3Start' occurs, and when 'activityBurst2Start' occurs.");
        });
        it("formats a compound event ID with activity finished events", () => {
            let eventId = "activity:1c0cba59-cb9f-4244-ba2f-f95ee8760794:finished,enrollment";
            expect(fmt.formatSchedule({eventId}, ACTIVITY_FORMATTER)).to.equal("On enrollment and when activity 'activity1' is finished.");
        })
    });
    describe("delay", () => {
        it("formats delay", () => {
            expect(fmt.formatSchedule({eventId: 'activities_retrieved', delay: 'P4D'})).to.equal("4 days after activities first retrieved.");
        });
    });
    describe("activities", () => {
        it("formats persistent activity", () => {
            let sch = {"scheduleType":"persistent","eventId":"activity:1c0cba59-cb9f-4244-ba2f-f95ee8760794:finished,enrollment","activities":[{"label":"My Thoughts","labelDetail":"2 Questions","guid":"1c0cba59-cb9f-4244-ba2f-f95ee8760794","survey":{"identifier":"mythoughts","guid":"46ca2bd1-4ca8-41de-b09a-b9ada80f682a","type":"SurveyReference"},"activityType":"survey","type":"Activity"}],"persistent":true,"times":[],"type":"Schedule"};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, null, SURVEY_FORMATTER)).to.equal(
                "On enrollment and when activity 'activity1' is finished, make the survey 'My Thoughts' permanently available."
            );
        });
        it("formats multiple persistent activities", () => {
            let sch = {"scheduleType":"persistent","eventId":"activity:1c0cba59-cb9f-4244-ba2f-f95ee8760794:finished,enrollment","activities":[{"label":"My Thoughts","labelDetail":"2 Questions","guid":"1c0cba59-cb9f-4244-ba2f-f95ee8760794","survey":{"identifier":"mythoughts","guid":"46ca2bd1-4ca8-41de-b09a-b9ada80f682a","type":"SurveyReference"},"activityType":"survey","type":"Activity"},{"label":"My Thoughts","labelDetail":"2 Questions","guid":"1c0cba59-cb9f-4244-ba2f-f95ee8760794","survey":{"identifier":"mythoughts","guid":"46ca2bd1-4ca8-41de-b09a-b9ada80f682a","type":"SurveyReference"},"activityType":"survey","type":"Activity"}],"persistent":true,"times":[],"type":"Schedule"};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, null, SURVEY_FORMATTER)).to.equal(
                "On enrollment and when activity 'activity1' is finished, make the survey 'My Thoughts' permanently available to do 2 times."
            );
        });
        it("formats recurring activity", () => {
            let sch = {"scheduleType":"recurring","eventId":"enrollment","activities":[{"label":"Walking Activity","labelDetail":"1.5 Minutes","guid":"249f8603-9b1d-4ddf-99a6-c2cd9a0f5849","task":{"identifier":"4-APHTimedWalking-80F09109-265A-49C6-9C5D-765E49AAF5D9","type":"TaskReference"},"activityType":"task","type":"Activity"}],"persistent":false,"interval":"P1D","times":["00:00:00.000"],"type":"Schedule"};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)).to.equal(
                "On enrollment, and every 1 day thereafter at 12:00 AM, do task 'Timed Walk'."
            );
        });
        it("formats multiple recurring activity", () => {
            let sch = {"scheduleType":"recurring","eventId":"enrollment","activities":[{"label":"Walking Activity","labelDetail":"1.5 Minutes","guid":"249f8603-9b1d-4ddf-99a6-c2cd9a0f5849","task":{"identifier":"4-APHTimedWalking-80F09109-265A-49C6-9C5D-765E49AAF5D9","type":"TaskReference"},"activityType":"task","type":"Activity"},{"label":"Walking Activity","labelDetail":"1.5 Minutes","guid":"9067239c-bca9-4ba5-831e-a0da469115c5","task":{"identifier":"4-APHTimedWalking-80F09109-265A-49C6-9C5D-765E49AAF5D9","type":"TaskReference"},"activityType":"task","type":"Activity"}],"persistent":false,"interval":"P1D","times":["00:00:00.000"],"type":"Schedule"};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)).to.equal(
                "On enrollment, and every 1 day thereafter at 12:00 AM, do task 'Timed Walk' 2 times."
            );
        });
        it("formats multiple times in recurring activities", () => {

        });
        it("formats a task activity", () => {

        });
        it("formats a survey activity", () => {

        });
        it("formats a compound activity", () => {

        });
        it("formats multiple activities", () => {
        });
    });
    describe("sequences", () => {
        it("formats a sequence of recurring tasks", () => {
            let sch = {"scheduleType":"recurring","eventId":"activities_retrieved","sequencePeriod":"P19D","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"4-APHTimedWalking-80F09109-265A-49C6-9C5D-765E49AAF5D9","type":"TaskReference"},"activityType":"task","type":"Activity"}],"persistent":false,"interval":"P1D","times":["00:00:00.000"],"type":"Schedule"};
    
            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)).to.equal(
                "On activities first retrieved, and every 1 day thereafter at 12:00 AM, do task 'Timed Walk'. End this sequence of activities at 19 days."
            );
        });
    });
    describe("expiration", () => {
        it("formats expiration periods", () => {
            let sch = {"scheduleType":"recurring","eventId":"activities_retrieved","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"4-APHTimedWalking-80F09109-265A-49C6-9C5D-765E49AAF5D9","type":"TaskReference"},"activityType":"task","type":"Activity"}],"persistent":false,"interval":"P1D","expires":"P3D","times":["00:00:00.000"],"type":"Schedule"};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)).to.equal(
                "On activities first retrieved, and every 1 day thereafter at 12:00 AM, do task 'Timed Walk'. Expire tasks after 3 days."
            );
        });
    });
    describe("time window", () => {
        it("formats time range with start", () => {
            let sch = {"scheduleType":"recurring","eventId":"activities_retrieved","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"4-APHTimedWalking-80F09109-265A-49C6-9C5D-765E49AAF5D9","type":"TaskReference"},"activityType":"task","type":"Activity"}],"persistent":false,"interval":"P1D","times":["14:20:00.000"],"startsOn":"2018-09-07T17:22:14.471Z","type":"Schedule"};

            expect(
                fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)
            ).to.equal("On activities first retrieved, and every 1 day thereafter at 14:20, do task 'Timed Walk'. Only schedule tasks after <span class='times-label'>2018-09-07T17:22:14.471Z</span>.");
        });
        it("formats time range with end", () => {
            let sch = {"scheduleType":"recurring","eventId":"activities_retrieved","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"4-APHTimedWalking-80F09109-265A-49C6-9C5D-765E49AAF5D9","type":"TaskReference"},"activityType":"task","type":"Activity"}],"persistent":false,"interval":"P1D","times":["14:00:00.000"],"endsOn":"2018-09-17T17:22:14.471Z","type":"Schedule"};

            expect(
                fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)
            ).to.equal("On activities first retrieved, and every 1 day thereafter at 2:00 PM, do task 'Timed Walk'. Only schedule tasks before <span class='times-label'>2018-09-17T17:22:14.471Z</span>.");            
        });
        it("formats time range with start and end", () => {
            let sch = {"scheduleType":"recurring","eventId":"enrollment","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"4-APHTimedWalking-80F09109-265A-49C6-9C5D-765E49AAF5D9","type":"TaskReference"},"activityType":"task","type":"Activity"}],"persistent":false,"interval":"P1D","times":["14:00:00.000"],"startsOn":"2018-09-07T17:22:14.471Z","endsOn":"2018-09-17T17:22:14.471Z","type":"Schedule"};

            expect(
                fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)
            ).to.equal(
                "On enrollment, and every 1 day thereafter at 2:00 PM, do task 'Timed Walk'. Only schedule tasks after <span class='times-label'>2018-09-07T17:22:14.471Z</span> and before <span class='times-label'>2018-09-17T17:22:14.471Z</span>."
            );
        });
    });
});
