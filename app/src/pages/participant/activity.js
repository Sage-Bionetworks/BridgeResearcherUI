import { Binder } from '../../binder';
import fn from '../../functions';
import jsonFormatter from '../../json_formatter';
import root from '../../root';
import scheduleUtils from '../../pages/schedule/schedule_utils';
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

var failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});

module.exports = function(params) {
    var self = this;
    // params.guid, params.userId

    self.vm = self;
    self.callback = fn.identity;

    self.formatTitleCase = fn.formatTitleCase;
    self.formatDateTime = fn.formatDateTime;

    self.formatActivityClass = function(item) {
        return (item.activity.activityType === "survey") ? "tasks icon" : "child icon";
    };
    self.formatActivity = function(item) {
        var act = item.activity;
        var string = act.label;
        if (act.detail) {
            string += " (" + act.detail + ") ";
        }
        return string;
    };

    new Binder(self)
        .obs('userId', params.userId)
        .obs('isNew', false)
        .obs('title', '&#160;')
        .obs('guid', params.guid)
        .obs('startDate')
        .obs('endDate')
        .obs('status')
        .obs('warn', false)
        .obs('activityLabel', '&#160;');

    tables.prepareTable(self, {
        name: "activitie",
        type: "Activity",
        refresh: self.loadingFunc
    });
    
    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
        self.statusObs(part.status);
    }).catch(failureHandler);

    self.isPublicObs = root.isPublicObs;

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

    serverService.getSchedulePlans().then(function(response) {
        response.items.forEach(function(plan) {
            scheduleUtils.getActivitiesWithStrategyInfo(plan).forEach(function(spec) {
                if (spec.guid == params.guid) {
                    self.activityLabelObs(spec.label);
                }
            });
        });
    }).catch(failureHandler);

    self.loadingFunc = function(args) {
        args = args || {};
        args.scheduledOnStart = fn.dateTimeString(self.startDateObs());
        args.scheduledOnEnd = fn.dateTimeString(self.endDateObs());

        if (!bothOrNeither(args.scheduledOnStart, args.scheduledOnEnd)) {
            self.warnObs(true);
            return Promise.resolve({});
        }
        self.warnObs(false);

        return serverService.getParticipantActivities(self.userIdObs(), params.guid, args)
            .then(function(response) {
                response.items = response.items.map(jsonFormatter.mapClientDataItem);
                self.itemsObs(response.items);
                return response;
            });
    };
};