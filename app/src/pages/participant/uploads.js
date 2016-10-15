var utils = require('../../utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');
var tables = require('../../tables');
var transforms = require('../../transforms');
var root = require('../../root');

var ONE_DAY = 1000*60*60*24;

function createRanges() {
    var ranges = [];
    for (var i=0; i<15; i++) {
        var d = new Date();
        d.setTime(d.getTime() - (i*ONE_DAY));
        ranges.push({value: -i, label: d.toDateString()});
    }
    return ranges;
}
function sortUploads(b,a) {
    return (a.requestedOn < b.requestedOn) ? -1 : (a.requestedOn > b.requestedOn) ? 1 : 0;
}

module.exports = function(params) {
    var self = this;
    var ranges = createRanges();

    bind(self)
        .obs('userId', params.userId)
        .obs('name', '')
        .obs('ranges[]', ranges)
        .obs('selectedRange', ranges[0])
        .obs('showLoader', false)
        .obs('day')
        .obs('total', 0)
        .obs('isNew', false)
        .obs('title', '&#160;');

    serverService.getParticipantName(params.userId).then(function(part) {
        self.titleObs(root.isPublicObs() ? part.name : part.externalId);
        self.nameObs(root.isPublicObs() ? part.name : part.externalId);
    }).catch(utils.failureHandler());

    self.isPublicObs = root.isPublicObs;
    self.formatLocalDateTime = transforms.formatLocalDateTime;
    self.selectedRangeObs.subscribe(load);

    tables.prepareTable(self, 'upload');

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
    self.priorVisible = function() {
        var index = getSelectedIndex();
        return (index < ranges.length-1);   
    };
    self.nextVisible = function() {
        var index = getSelectedIndex();
        return (index > 0);
    };
    self.priorDay = function() {
        if (self.showLoaderObs()){ return false; }
        var index = getSelectedIndex();
        self.selectedRangeObs(ranges[index+1]);
        return false;
    };
    self.nextDay = function() {
        if (self.showLoaderObs()){ return false; }
        var index = getSelectedIndex();
        self.selectedRangeObs(ranges[index-1]);
        return false;
    };
    self.selectRange = function(data, event) {
        if (self.showLoaderObs()){ return false; }
        self.selectedRangeObs(data);
        return false;
    };
    self.uploadURL = function(data) {
        return '#/participants/' + self.userIdObs() + '/uploads/' + data.uploadId;
    };
    self.toggle = function(model) {
        model.collapsedObs(!model.collapsedObs());
    };
    self.refresh = function() {
        if (self.showLoaderObs()){ return; }
        self.selectedRangeObs(ranges[0]);
        load();
    };
    function getSelectedIndex() {
        return ranges.indexOf( self.selectedRangeObs() );
    }
    function processItem(item) {
        var shortId = transforms.truncateGUID(item.uploadId);
        item.uploadId = "<span class='upload-id' title='"+item.uploadId+"'>"+shortId+"</span>";
        bind(item)
            .obs('content','')
            .obs('href','')
            .obs('collapsed', true)
            .obs('completedBy', '');
            
        item.uploadProgress = "1";
        item.uploadProgressLabel = "Upload Requested";
        if (item.status === 'succeeded') {
            var id = item.schemaId;
            var rev = item.schemaRevision;
            item.contentObs(id);
            item.hrefObs('/#/schemas/'+encodeURIComponent(id)+'/versions/'+rev);
            item.uploadProgress = "2";
            item.uploadProgressLabel = "Upload Completed";
        } 
        if (item.status === 'succeeded' && item.healthRecordExporterStatus === 'succeeded') {
            item.uploadProgress = "3";  
            item.uploadProgressLabel = "Export Completed";
        } 

        item.completedByObs(formatCompletedBy(item));
    }
    function formatCompletedBy(item) {
        if (item.status === 'succeeded') {
            var start = new Date(item.requestedOn).getTime();
            var end = new Date(item.completedOn).getTime();
            var fStart = transforms.formatLocalDateTime(item.requestedOn);
            var fEnd = transforms.formatLocalDateTime(item.completedOn);
            if (fStart.split(', ')[0] === fEnd.split(', ')[0]) {
                fEnd = fEnd.split(', ')[1];
            }
            return fEnd+" ("+item.completedBy+", "+transforms.formatMs(end-start)+")";
        } else if (item.status === 'duplicate') {
            var shortDup = transforms.truncateGUID(item.duplicateUploadId);
            return "duplicates <span class='upload-id' title='"+item.duplicateUploadId+"'>"+
                shortDup+"</span>";
        }
        return '';
    }
    function processUploads(response) {
        response = {
            "items": [
                {
                    "status": "succeeded",
                    "schemaId": "123",
                    "schemaRevision": "abc",
                    "requestedOn": "2016-10-14T19:29:22.174Z",
                    "completedOn": "2016-10-14T19:29:22.174Z",
                    "completedBy": "abc",
                    "uploadId": "abd123",
                    "healthRecordExporterStatus": "succeeded"
                },
                {
                    "status": "af",
                    "schemaId": "123",
                    "schemaRevision": "abc",
                    "requestedOn": "2016-10-14T19:29:22.174Z",
                    "completedOn": "2016-10-14T19:29:22.174Z",
                    "completedBy": "abc",
                    "uploadId": "abd123",
                    "healthRecordExporterStatus": "succeeded"
                },
                {
                    "status": "succeeded",
                    "schemaId": "123",
                    "schemaRevision": "abc",
                    "requestedOn": "2016-10-14T19:29:22.174Z",
                    "completedOn": "2016-10-14T19:29:22.174Z",
                    "completedBy": "abc",
                    "uploadId": "abd123",
                    "healthRecordExporterStatus": "asdfas"
                }
            ],
            "startTime": "2016-10-14T19:29:22.174Z"
        };
        var dateString = transforms.formatLocalDateTimeWithoutZone(response.startTime).split(" @ ")[0];
        self.dayObs(dateString);
        self.totalObs(response.items.length);
        response.items.sort(sortUploads);
        response.items.map(processItem);
        self.itemsObs(response.items);
        return response;
    }
    function load() {
        self.showLoaderObs(true);
        var index = getSelectedIndex();
        var range = utils.getDateRange(ranges[index].value);
        serverService.getParticipantUploads(params.userId, range.startTime, range.endTime)
            .then(processUploads).then(function() {
                $('.ui .progress').progress();
                self.showLoaderObs(false);
            })
            .catch(function() {
                self.showLoaderObs(false);
            })
            .catch(utils.failureHandler());
    }
    load();
};