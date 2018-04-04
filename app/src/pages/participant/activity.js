import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import jsonFormatter from '../../json_formatter';
import root from '../../root';
import scheduleUtils from '../../pages/schedule/schedule_utils';
import tables from '../../tables';
import utils from '../../utils';

const failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});

module.exports = function(params) {
    let self = this;

    self.vm = self;
    self.callback = fn.identity;

    self.formatTitleCase = fn.formatTitleCase;
    self.formatDateTime = fn.formatDateTime;

    self.formatActivityClass = function(item) {
        return (item.activity.activityType === "survey") ? "tasks icon" : "child icon";
    };
    self.formatActivity = function(item) {
        let act = item.activity;
        let string = act.label;
        if (act.detail) {
            string += " (" + act.detail + ") ";
        }
        return string;
    };

    let {start, end} = fn.getRangeInDays(-14, 14);
    
    new Binder(self)
        .obs('userId', params.userId)
        .obs('title', '&#160;')
        .obs('guid', params.guid)
        .obs('startDate', start)
        .obs('endDate', end)
        .obs('status')
        .obs('warn', false)
        .obs('activityLabel', '&#160;');

    tables.prepareTable(self, {
        name: "activitie",
        type: "Activity",
        refresh: self.loadingFunc
    });
    
    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(part.name);
        self.statusObs(part.status);
    }).catch(failureHandler);

    self.toggle = function(model) {
        model.collapsedObs(!model.collapsedObs());
    };
    self.editReportRecord = function(item, event) {
        root.openDialog('json_editor', {
            saveFunc: self.saveFunc,
            closeFunc: root.closeDialog,
            item: item,
            data: item.data
        });
        return false;
    };
    self.saveFunc = function(item, data) {
        item.clientData = data;
        root.closeDialog();
    };
    self.doCalSearch = function() {
        self.callback();
    };
    self.clearStart = function() {
        self.startDateObs(null);
        self.callback();
    };
    self.clearEnd = function() {
        self.endDateObs(null);
        self.callback();
    };
    function bothOrNeither(startDate, endDate) {
        return (startDate === null && endDate === null) || (startDate !== null && endDate !== null);
    }

    if (params.referentType === "surveys") {
        serverService.getSurveyMostRecent(params.guid).then(function(response) {
            self.activityLabelObs(response.name);    
        });
    } else {
        self.activityLabelObs(params.guid);
    }

    self.loadingFunc = function(args) {
        args = args || {};
        args.scheduledOnStart = fn.dateTimeString(self.startDateObs());
        if (self.endDateObs()) {
            let date = new Date(self.endDateObs());
            date.setDate(date.getDate()+1);
            args.scheduledOnEnd = fn.dateTimeString(date);
        }
        if (!bothOrNeither(args.scheduledOnStart, args.scheduledOnEnd)) {
            self.warnObs(true);
            return Promise.resolve({});
        }
        self.warnObs(false);

        return serverService.getParticipantNewActivities(
            self.userIdObs(), params.referentType, params.guid, args).then(function(response) {
                response.items = response.items.map(jsonFormatter.mapClientDataItem);
                self.itemsObs(response.items);
                return response;
            });
    };
};