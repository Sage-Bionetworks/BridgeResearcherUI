import fmt from '../app/src/schedule_formatter.js';
import { expect } from 'chai';

const ACTIVITY_FORMATTER = (guid) => {
    return (guid === '1c0cba59') ? 'activity1' : 'ERROR'; 
};
const TASK_FORMATTER = (id) => {
    return (id === 'APHTimedWalking') ? 'Timed Walk' : 'ERROR';
};
const SURVEY_FORMATTER = (guid) => {
    return (guid === '46ca2bd1') ? 'My Thoughts' : 'ERROR';
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
            let eventId = "activity:1c0cba59:finished,enrollment";
            expect(fmt.formatSchedule({eventId}, ACTIVITY_FORMATTER)).to.equal("On enrollment and when activity 'activity1' is finished.");
        })
    });
    describe("delay", () => {
        it("formats delay", () => {
            expect(fmt.formatSchedule({eventId: 'activities_retrieved', delay: 'P4D'})).to.equal("4 days after activities first retrieved.");
        });
    });
    describe("once schedule", () => {
        it("formats once schedule", () => {
            let sch = {"scheduleType":"once","eventId":"activity:1c0cba59:finished,enrollment","activities":[{"label":"My Thoughts","guid":"1c0cba59","survey":{"guid":"46ca2bd1"},"activityType":"survey"}],"persistent":false,"times":[]};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, null, SURVEY_FORMATTER)).to.equal(
                "On enrollment and when activity 'activity1' is finished, do survey 'My Thoughts'."
            );
        });
        it("formats once schedule (activity repeated)", () => {
            let sch = {"scheduleType":"once","eventId":"activity:1c0cba59:finished,enrollment","activities":[{"label":"My Thoughts","guid":"1c0cba59","survey":{"guid":"46ca2bd1"},"activityType":"survey"},{"label":"My Thoughts","guid":"1c0cba59","survey":{"guid":"46ca2bd1"},"activityType":"survey"}],"persistent":false,"times":[]};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, null, SURVEY_FORMATTER)).to.equal(
                "On enrollment and when activity 'activity1' is finished, do survey 'My Thoughts' 2 times."
            );
        });
        it("formats once schedule with times", () => {
            let sch = {"scheduleType":"once","activities":[{"label":"Do This","labelDetail":"Yes","guid":"64aaf918-b8a1-464f-9bff-416e4a377a34","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task","type":"Activity"}],"persistent":false,"delay":"P1D","expires":"P1D","times":["19:00:00.000","20:00:00.000"],"type":"Schedule"}

            expect(
                fmt.formatSchedule(sch, null, TASK_FORMATTER)
            ).to.equal(
                "A day after enrollment, do task 'Timed Walk' at 7:00 PM and 8:00 PM. Expire activity after a day."
            );
        });
    });
    describe("persistent schedule", () => {
        it("formats persistent schedule", () => {
            let sch = {"scheduleType":"persistent","eventId":"activity:1c0cba59:finished,enrollment","activities":[{"label":"My Thoughts","guid":"1c0cba59","survey":{"guid":"46ca2bd1"},"activityType":"survey"}],"persistent":true,"times":[]};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, null, SURVEY_FORMATTER)).to.equal(
                "On enrollment and when activity 'activity1' is finished, make the survey 'My Thoughts' permanently available."
            );
        });
        it("formats persistent schedule (activity repeated)", () => {
            let sch = {"scheduleType":"persistent","eventId":"activity:1c0cba59:finished,enrollment","activities":[{"label":"My Thoughts","guid":"1c0cba59","survey":{"guid":"46ca2bd1"},"activityType":"survey"},{"label":"My Thoughts","guid":"1c0cba59","survey":{"guid":"46ca2bd1"},"activityType":"survey"}],"persistent":true,"times":[]};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, null, SURVEY_FORMATTER)).to.equal(
                "On enrollment and when activity 'activity1' is finished, make the survey 'My Thoughts' (to do 2 times) permanently available."
            );
        });
    });
    describe("recurring schedule", () => {
        it("formats recurring schedule", () => {
            let sch = {"scheduleType":"recurring","eventId":"enrollment","activities":[{"label":"Walking Activity","guid":"249f8603","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"}],"persistent":false,"interval":"P1D","times":["00:00:00.000"]};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)).to.equal(
                "On enrollment, and every 1 day thereafter at 12:00 AM, do task 'Timed Walk'."
            );
        });
        it("formats recurring schedule (activity repeated)", () => {
            let sch = {"scheduleType":"recurring","eventId":"enrollment","activities":[{"label":"Walking Activity","guid":"249f8603","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"},{"label":"Walking Activity","guid":"9067239c-bca9-4ba5-831e-a0da469115c5","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"}],"persistent":false,"interval":"P1D","times":["00:00:00.000"]};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)).to.equal(
                "On enrollment, and every 1 day thereafter at 12:00 AM, do task 'Timed Walk' 2 times."
            );
        });
        it("formats recurring schedule (more than one activity)", () => {
            let sch = {"scheduleType":"recurring","eventId":"enrollment","activities":[{"label":"Walking Activity","guid":"249f8603","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"},{"label":"My Thoughts","guid":"1c0cba59","survey":{"guid":"46ca2bd1"},"activityType":"survey"}],"persistent":false,"interval":"P1D","times":["00:00:00.000"]};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)).to.equal(
                "On enrollment, and every 1 day thereafter at 12:00 AM, do task 'Timed Walk' and do survey 'My Thoughts'."
            );
        });
        it("format recurring schedule (at multiple times)", () => {
            let sch = {"scheduleType":"recurring","eventId":"enrollment","activities":[{"label":"Walking Activity","guid":"249f8603","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"}],"persistent":false,"interval":"P1D","times":["00:00:00.000","14:30:00.000","20:00:00.000"]};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)).to.equal(
                "On enrollment, and every 1 day thereafter at 12:00 AM, 2:30 PM, and 8:00 PM, do task 'Timed Walk'."
            );
        });
        it("format recurring schedule (using cron trigger)", () => {
            let sch = {"scheduleType":"recurring","cronTrigger":"0 0 12 1/1 * ? *","activities":[{"label":"Test","guid":"6767397f-f021-4233-8fb7-2d96e78672ce","compoundActivity":{"schemaList":[],"surveyList":[],"taskIdentifier":"My Task","type":"CompoundActivity"},"activityType":"compound"}],"persistent":false,"expires":"P3D","times":[]};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)).to.equal(
                "On enrollment, and thereafter on the cron '0 0 12 1/1 * ? *', do compound task 'My Task'. Expire activity after 3 days."
            );
        });
    });
    describe("sequence schedule", () => {
        it("format sequece schedule", () => {
            let sch = {"scheduleType":"recurring","eventId":"activities_retrieved","sequencePeriod":"P19D","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"}],"persistent":false,"interval":"P1D","times":["00:00:00.000"]};
    
            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)).to.equal(
                "On activities first retrieved, and every 1 day thereafter at 12:00 AM, do task 'Timed Walk'. End this sequence of activities at 19 days."
            );
        });
    });    
    describe("activities", () => {
        it("formats a task activity", () => {
            let sch = {"scheduleType":"once","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"}]};

            expect(
                fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)
            ).to.equal("On enrollment, do task 'Timed Walk'.");
        });
        it("formats a survey activity", () => {
            let sch = {"scheduleType":"once","activities":[{"label":"My Thoughts","guid":"1c0cba59","survey":{"guid":"46ca2bd1"},"activityType":"survey"}]};

            expect(
                fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)
            ).to.equal("On enrollment, do survey 'My Thoughts'.");
        });
        it("formats a compound activity", () => {
            let sch = {"scheduleType":"once","activities":[{"label":"Test","guid":"6767397f-f021-4233-8fb7-2d96e78672ce","compoundActivity":{"schemaList":[],"surveyList":[],"taskIdentifier":"My Task","type":"CompoundActivity"},"activityType":"compound","type":"Activity"}]}

            expect(
                fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)
            ).to.equal("On enrollment, do compound task 'My Task'.");
        });
        it("formats multiple activities", () => {
            let sch = {"scheduleType":"once","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"},{"label":"My Thoughts","guid":"1c0cba59","survey":{"guid":"46ca2bd1"},"activityType":"survey"},{"label":"Test","guid":"6767397f-f021-4233-8fb7-2d96e78672ce","compoundActivity":{"schemaList":[],"surveyList":[],"taskIdentifier":"My Task","type":"CompoundActivity"},"activityType":"compound","type":"Activity"}]};

            expect(
                fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)
            ).to.equal(
                "On enrollment, do task 'Timed Walk', do survey 'My Thoughts', and do compound task 'My Task'."
            );
        });
    });
    describe("expiration", () => {
        it("formats expiration periods", () => {
            let sch = {"scheduleType":"recurring","eventId":"activities_retrieved","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"}],"persistent":false,"interval":"P1D","expires":"P3D","times":["00:00:00.000"]};

            expect(fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)).to.equal(
                "On activities first retrieved, and every 1 day thereafter at 12:00 AM, do task 'Timed Walk'. Expire activity after 3 days."
            );
        });
    });
    describe("time window", () => {
        it("formats time range with start", () => {
            let sch = {"scheduleType":"recurring","eventId":"activities_retrieved","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"}],"persistent":false,"interval":"P1D","times":["14:20:00.000"],"startsOn":"2018-09-07T17:22:14.471Z"};

            expect(
                fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)
            ).to.equal("On activities first retrieved, and every 1 day thereafter at 14:20, do task 'Timed Walk'. Only schedule activities after <span class='times-label'>2018-09-07T17:22:14.471Z</span>.");
        });
        it("formats time range with end", () => {
            let sch = {"scheduleType":"recurring","eventId":"activities_retrieved","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"}],"persistent":false,"interval":"P1D","times":["14:00:00.000"],"endsOn":"2018-09-17T17:22:14.471Z"};

            expect(
                fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)
            ).to.equal("On activities first retrieved, and every 1 day thereafter at 2:00 PM, do task 'Timed Walk'. Only schedule activities before <span class='times-label'>2018-09-17T17:22:14.471Z</span>.");            
        });
        it("formats time range with start and end", () => {
            let sch = {"scheduleType":"recurring","eventId":"enrollment","activities":[{"label":"Study Burst Task","guid":"fe79d987-28a2-4ccd-bcf3-b3d07b925a6b","task":{"identifier":"APHTimedWalking","type":"TaskReference"},"activityType":"task"}],"persistent":false,"interval":"P1D","times":["14:00:00.000"],"startsOn":"2018-09-07T17:22:14.471Z","endsOn":"2018-09-17T17:22:14.471Z"};

            expect(
                fmt.formatSchedule(sch, ACTIVITY_FORMATTER, TASK_FORMATTER, SURVEY_FORMATTER)
            ).to.equal(
                "On enrollment, and every 1 day thereafter at 2:00 PM, do task 'Timed Walk'. Only schedule activities after <span class='times-label'>2018-09-07T17:22:14.471Z</span> and before <span class='times-label'>2018-09-17T17:22:14.471Z</span>."
            );
        });
    });
});
