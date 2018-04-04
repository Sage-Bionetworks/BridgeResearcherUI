import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import root from '../../root';
import tables from '../../tables';
import utils from '../../utils';

const PAGE_SIZE = 25;
const failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});

module.exports = function(params) {
    let self = this;

    let {start, end} = fn.getRangeInDays(-14, 0);
    
    // For the forward pager control.
    self.vm = self;
    self.callback = fn.identity;

    new Binder(self)
        .obs('userId', params.userId)
        .obs('name', '')
        .obs('uploadsStartDate', start)
        .obs('uploadsEndDate', end)
        .obs('warn', false)
        .obs('isNew', false)
        .obs('status')
        .obs('title', '&#160;');

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(part.name);
        self.nameObs(part.name);
        self.statusObs(part.status);
    }).catch(failureHandler);

    fn.copyProps(self, fn, 'formatDateTime');

    tables.prepareTable(self, {name:'upload'});

    self.classFor = function(item) {
        switch(item.status) {
            case 'unknown': return 'negative';
            case 'validation_failed': return 'warning';
            case 'duplicate': return 'warning';
            default: return '';
        }
    };
    self.iconFor = function(item) {
        switch(item.status) {
            case 'unknown': return 'help circle icon';
            case 'validation_in_progress': return 'refresh icon';
            case 'validation_failed': return 'ui yellow text warning sign icon';
            case 'duplicate': return 'ui yellow text copy icon';
            case 'succeeded': return 'ui green text checkmark icon';
            default: return '';
        }
    };

    function dateToString(date, atStart) {
        return (date) ? fn.dateToLocalISOString(fn.asDate(date), "00:00:00") : null;
    }

    function dateRange() {
        let start = dateToString(self.uploadsStartDateObs());
        let end = self.uploadsEndDateObs();
        end.setDate(end.getDate()+1);
        end = dateToString(end);
        return {start, end};
    }

    self.doCalSearch = function() {
        let {start, end} = dateRange();

        let oneMissing = (start === null || end === null);
        self.warnObs(oneMissing);
        if (!oneMissing) {
            self.itemsObs([]);
            self.recordsMessageObs("<div class='ui tiny active inline loader'></div>");
            self.callback();
        }
    };
    self.htmlFor = function(data) {
        if (data.validationMessageList === undefined) return null;
        return data.validationMessageList.map(function(error) {
            return "<p class='error-message'>"+error+"</p>";
        }).join('');
    };
    self.uploadURL = function(data) {
        return '#/participants/' + self.userIdObs() + '/uploads/' + data.uploadId;
    };
    self.toggle = function(model) {
        model.collapsedObs(!model.collapsedObs());
    };
    function processItem(item) {
        new Binder(item)
            .obs('content','')
            .obs('href','')
            .obs('collapsed', true)
            .obs('completedBy', '');
            
        if (item.status === 'succeeded') {
            let id = item.schemaId;
            let rev = item.schemaRevision;
            item.contentObs(id);
            item.hrefObs('/#/schemas/'+encodeURIComponent(id)+'/versions/'+rev+'/editor');
        }
        item.progressState = getSemanticControlState(item);
        item.completedByObs(formatCompletedBy(item));
    }
    function getSemanticControlState(item) {
        let obj = {type: 'progress', color: 'gray', value: 1, label: 'Upload Requested', total:3};
        if (item.status === 'succeeded') {
            obj.value = 2;
            obj.label = "Upload Completed";
            if (item.healthRecordExporterStatus === 'succeeded') {
                obj.value = 3;  
                obj.label = "Export Completed";
                obj.color = "green";
            } else if (typeof item.healthRecordExporterStatus === 'undefined') {
                obj.color = "green";
            }
        } else if (item.status === 'duplicate') {
            obj.value = 2;
            obj.label = "Upload Error";
        }
        return obj;
    }

    function formatCompletedBy(item) {
        if (item.status === 'succeeded') {
            let start = new Date(item.requestedOn).getTime();
            let end = new Date(item.completedOn).getTime();
            let fStart = fn.formatDateTime(item.requestedOn);
            let fEnd = fn.formatDateTime(item.completedOn);
            if (fStart.split(', ')[0] === fEnd.split(', ')[0]) {
                fEnd = fEnd.split(', ')[1];
            }
            return fEnd+" ("+item.completedBy+", "+fn.formatMs(end-start)+")";
        } else if (item.status === 'duplicate') {
            return "duplicates <span class='upload-id'>"+item.duplicateUploadId+"</span>";
        }
        return '';
    }
    function processUploads(response) {
        if (response.items) {
            response.items.map(processItem);
            self.itemsObs(response.items);
        }
        return response;
    }
    
    self.loadingFunc = function(args) {
        args = args || {};
        args.pageSize = PAGE_SIZE;
        let {start, end} = dateRange();
        args.startTime = start;
        args.endTime = end;
        return serverService.getParticipantUploads(params.userId, args)
            .then(processUploads)
            .catch(failureHandler);
    };
};