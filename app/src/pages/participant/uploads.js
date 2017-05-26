var utils = require('../../utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');
var tables = require('../../tables');
var root = require('../../root');
var fn = require('../../functions');

function sortUploads(b,a) {
    return (a.requestedOn < b.requestedOn) ? -1 : (a.requestedOn > b.requestedOn) ? 1 : 0;
}

module.exports = function(params) {
    var self = this;
    bind(self)
        .obs('userId', params.userId)
        .obs('name', '')
        .obs('selectedRange', new Date())
        .obs('showLoader', false)
        .obs('day')
        .obs('total', 0)
        .obs('isNew', false)
        .obs('title', '&#160;');

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
        self.nameObs(root.isPublicObs() ? part.name : part.externalId);
    }).catch(utils.failureHandler());

    fn.copyProps(self, root, 'isPublicObs');
    fn.copyProps(self, fn, 'formatDateTime');
    self.selectedRangeObs.subscribe(load);

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
    self.htmlFor = function(data) {
        if (data.validationMessageList === undefined) return null;
        return data.validationMessageList.map(function(error) {
            return "<p class='ui segment error-message'>"+error+"</p>";
        }).join('');
    };
    self.selectRange = function(data, event) {
        var date = event.currentTarget._flatpickr.selectedDateObj;
        self.selectedRangeObs(date);
        return false;
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
            item.hrefObs('/#/schemas/'+encodeURIComponent(id)+'/versions/'+rev);
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
        var dateString = fn.formatDate(response.startTime);
        self.dayObs(dateString);
        self.totalObs(response.items.length);
        response.items.sort(sortUploads);
        response.items.map(processItem);
        self.itemsObs(response.items);
        return response;
    }
    function getDateRange(date) {
        date = (date) ? new Date(date) : new Date();
        return {
            startTime: date.toISOString().split("T")[0] + "T00:00:00.000Z", 
            endTime: date.toISOString().split("T")[0] + "T23:59:59.999Z"
        };
    }    
    function load() {
        self.showLoaderObs(true);
        var range = getDateRange( self.selectedRangeObs() );
        serverService.getParticipantUploads(params.userId, range.startTime, range.endTime)
            .then(processUploads)
            .then(fn.handleStaticObsUpdate(self.showLoaderObs, false))
            .catch(utils.failureHandler());
    }
    load();
};