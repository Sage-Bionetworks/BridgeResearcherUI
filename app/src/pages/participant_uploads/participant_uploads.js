var utils = require('../../utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');
var tables = require('../../tables');
var transforms = require('../../transforms');

var ranges = Object.freeze([
    {value: 0, label:"Today"},
    {value:-1, label:"Yesterday"},
    {value:-2, label:"2 days ago"},
    {value:-3, label:"3 days ago"},
    {value:-4, label:"4 days ago"},
    {value:-5, label:"5 days ago"},
    {value:-6, label:"6 days ago"},
    {value:-7, label:"7 days ago"},
]);

function fakeResponse(response) {
    response.items = [
        {"contentLength":10000,"contentMd5":"abc","contentType":"application/json","filename":"filename.zip",
        "recordId":"ABC","status":"succeeded","studyId":"api","requestedOn":"2016-07-20T17:10:40.067Z",
        "completedOn":"2016-07-20T17:10:40.140Z","completedBy":"s3_worker","uploadDate":"2016-10-10",
        "uploadId":"021a2e98-4bf0-470f-a7a5-0354137546d8","validationMessageList":["message 1","message 2"],
        "version":2,"objectId":"DEF","type":"Upload"},
        {"contentLength":10000,"contentMd5":"abc","contentType":"application/json","filename":"filename.zip",
        "recordId":"ABC","status":"requested","studyId":"api","requestedOn":"2016-07-20T17:10:40.067Z",
        "uploadId":"021a2e98-4bf0-470f-a7a5-0354137546d8","validationMessageList":["message 1","message 2"],
        "version":2,"objectId":"DEF","type":"Upload"}        
    ];
    return response;
}

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

    tables.prepareTable(self, 'upload');

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
        load();
        return false;
    };
    self.nextDay = function() {
        var index = getSelectedIndex();
        self.selectedRangeObs(ranges[index-1]);
        load();
        return false;
    };
    self.selectRange = function(data, event) {
        self.selectedRangeObs(data);
        load();
        return false;
    };
    self.uploadURL = function(data) {
        return '#/participants/' + self.userIdObs() + '/uploads/' + data.uploadId + '/' + encodeURIComponent(params.name);
    };

    function getSelectedIndex() {
        return ranges.indexOf( self.selectedRangeObs() );
    }
    function processUploads(response) {
        if (response.items.length === 0) {
            response = fakeResponse(response);
        }
        self.loadedOnceObs(true);
        var dateString = transforms.formatLocalDateTimeWithoutZone(response.startTime).split(" @ ")[0];
        self.dayObs(dateString);
        self.itemsObs(response.items);
        self.pagerLoadingObs(false);
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