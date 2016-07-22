var utils = require('../../utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');
var tables = require('../../tables');
var transforms = require('../../transforms');
var ko = require('knockout');
var Promise = require('bluebird');

var ranges = Object.freeze([
    {value: 0, label:"Today"},
    {value:-1, label:"Yesterday"},
    {value:-2, label:"2 days ago"},
    {value:-3, label:"3 days ago"},
    {value:-4, label:"4 days ago"},
    {value:-5, label:"5 days ago"},
    {value:-6, label:"6 days ago"},
    {value:-7, label:"7 days ago"},

    {value:-8, label:"8 days ago"},
    {value:-9, label:"9 days ago"},
    {value:-10, label:"10 days ago"},
    {value:-11, label:"11 days ago"},
    {value:-12, label:"12 days ago"},
    {value:-13, label:"13 days ago"},
    {value:-14, label:"14 days ago"}
]);

module.exports = function(params) {
    var self = this;

    bind(self)
        .obs('userId', params.userId)
        .obs('name', params.name)
        .obs('ranges[]', ranges)
        .obs('selectedRange', ranges[0])
        .obs('pagerLoading', false)
        .obs('day')
        .obs('loadedOnce', false)
        .obs('isNew', false)
        .obs('title', params.name);

    self.formatLocalDateTime = transforms.formatLocalDateTime;
    self.selectedRangeObs.subscribe(load);

    tables.prepareTable(self, 'upload');

    self.classFor = function(item) {
        switch(item.status) {
            case 'unknown': return 'negative';
            //case 'requested': return '';
            //case 'validation_in_progress': return '';
            case 'validation_failed': return 'warning';
            //case 'succeeded': return '';
            default: return '';
        }
    };
    self.iconFor = function(item) {
        switch(item.status) {
            case 'unknown': return 'help circle icon';
            //case 'requested': return '';
            case 'validation_in_progress': return 'refresh icon';
            case 'validation_failed': return 'ui yellow text warning sign icon';
            case 'succeeded': return 'ui green text checkmark icon';
            default: return '';
        }
    };
    function popupTitleFor(item) {
        switch(item.status) {
            case 'unknown': return 'Unknown';
            case 'requested': return 'Requested';
            case 'validation_in_progress': return 'Validation in progress';
            case 'validation_failed': return 'Validation failed';
            case 'succeeded': return 'Succeeded';
            default: return '';
        }
    }

    self.priorVisible = function() {
        var index = getSelectedIndex();
        return (index < ranges.length-1);   
    };
    self.nextVisible = function() {
        var index = getSelectedIndex();
        return (index > 0);
    };
    self.priorDay = function() {
        var index = getSelectedIndex();
        self.selectedRangeObs(ranges[index+1]);
        return false;
    };
    self.nextDay = function() {
        var index = getSelectedIndex();
        self.selectedRangeObs(ranges[index-1]);
        return false;
    };
    self.selectRange = function(data, event) {
        self.selectedRangeObs(data);
        return false;
    };
    self.uploadURL = function(data) {
        return '#/participants/' + self.userIdObs() + '/uploads/' + data.uploadId + '/' + encodeURIComponent(params.name);
    };
    self.renderPopup = function(data) {
        return data.status === 'validation_failed';
    };
    self.htmlFor = function(data) {
        return "<p><b>"+popupTitleFor(data)+"</b></p>" + data.validationMessageList.map(function(error) {
            return "<p>"+error+"</p>";
        }).join('');
    };
    self.completedBy = function(data) {
        if (data.status === 'succeeded') {
            var start = new Date(data.requestedOn).getTime();
            var end = new Date(data.completedOn).getTime();
            return transforms.formatLocalDateTime(data.completedOn) + 
                " (" + data.completedBy + ", "+ transforms.formatMs(end-start)+")";
        }
        return '';
    };

    self.refresh = load;

    function getSelectedIndex() {
        return ranges.indexOf( self.selectedRangeObs() );
    }
    function forEachItem(item, i) {
        return getContentOfUpload(item, i*0);
    }
    function makeStatusCall(item) {
        return serverService.getParticipantUploadStatus(item.uploadId);
    }
    function getContentOfUpload(item, ms) {
        return Promise.delay(ms, item)
            .then(makeStatusCall)
            .then(function(response) {
                var id = response.record.schemaId;
                var rev = response.record.schemaRevision;
                item.contentObs(id);
                item.hrefObs('/#/schemas/'+encodeURIComponent(id)+'/versions/'+rev);
            });
    }
    
    function processUploads(response) {
        self.loadedOnceObs(true);
        var dateString = transforms.formatLocalDateTimeWithoutZone(response.startTime).split(" @ ")[0];
        self.dayObs(dateString);

        var finishedItems = response.items.map(function(item) {
            item.contentObs = ko.observable("");
            item.hrefObs = ko.observable();
            return item;
        }).filter(function(item) {
            return item.status === 'succeeded';
        });
        self.itemsObs([]);
        self.itemsObs(response.items);
        self.pagerLoadingObs(false);
        Promise.each(finishedItems, forEachItem);
        return response;
    }

    function load() {
        if (self.pagerLoadingObs()){
            return;
        }
        self.pagerLoadingObs(true);
        var index = getSelectedIndex();
        var range = utils.getDateRange(ranges[index].value);
        serverService.getParticipantUploads(params.userId, range.startTime, range.endTime)
            .then(processUploads);
    }
    load();
};