import Binder from '../../binder';
import fn from '../../functions';
import root from '../../root';
import serverService from '../../services/server_service';
import tables from '../../tables';
import utils from '../../utils';

const PAGE_SIZE = 25;
var failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});

module.exports = function(params) {
    var self = this;

    var today = new Date();
    var tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate()+1, 
        today.getHours(), today.getMinutes(), today.getSeconds());
    var start = today.toISOString("00:00:00");
    var end = tomorrow.toISOString("00:00:00");
    
    // For the forward pager control.
    self.vm = self;
    self.callback = fn.identity;

    new Binder(self)
        .obs('userId', params.userId)
        .obs('name', '')
        .obs('uploadsStartDate', new Date(start))
        .obs('uploadsEndDate', new Date(end))
        .obs('warn', false)
        .obs('isNew', false)
        .obs('status')
        .obs('title', '&#160;');

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
        self.nameObs(root.isPublicObs() ? part.name : part.externalId);
        self.statusObs(part.status);
    }).catch(failureHandler);

    fn.copyProps(self, root, 'isPublicObs');
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
        return (date) ? date.toLocalISOString("00:00:00") : null;
    }

    self.doCalSearch = function() {
        var start = dateToString(self.uploadsStartDateObs());
        var end = dateToString(self.uploadsEndDateObs());
        var oneMissing = (start === null || end === null);
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
            return "<p class='ui segment error-message'>"+error+"</p>";
        }).join('');
    };
    self.uploadURL = function(data) {
        return '#/participants/' + self.userIdObs() + '/uploads/' + data.uploadId;
    };
    self.toggle = function(model) {
        model.collapsedObs(!model.collapsedObs());
    };
    function processItem(item) {
        bind(item)
            .obs('content','')
            .obs('href','')
            .obs('collapsed', true)
            .obs('completedBy', '');
            
        if (item.status === 'succeeded') {
            var id = item.schemaId;
            var rev = item.schemaRevision;
            item.contentObs(id);
            item.hrefObs('/#/schemas/'+encodeURIComponent(id)+'/versions/'+rev+'/editor');
        }
        item.progressState = getSemanticControlState(item);
        item.completedByObs(formatCompletedBy(item));
    }
    function getSemanticControlState(item) {
        var obj = {type: 'progress', color: 'gray', value: 1, label: 'Upload Requested', total:3};
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
            var start = new Date(item.requestedOn).getTime();
            var end = new Date(item.completedOn).getTime();
            var fStart = fn.formatDateTime(item.requestedOn);
            var fEnd = fn.formatDateTime(item.completedOn);
            if (fStart.split(', ')[0] === fEnd.split(', ')[0]) {
                fEnd = fEnd.split(', ')[1];
            }
            return fEnd+" ("+item.completedBy+", "+fn.formatMs(end-start)+")";
        } else if (item.status === 'duplicate') {
            return "duplicates <span class='upload-id'>"+shortDup+"</span>";
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
        args.startTime = dateToString(self.uploadsStartDateObs());
        args.endTime = dateToString(self.uploadsEndDateObs());

        return serverService.getParticipantUploads(params.userId, args)
            .then(processUploads)
            .catch(failureHandler);
    };
};