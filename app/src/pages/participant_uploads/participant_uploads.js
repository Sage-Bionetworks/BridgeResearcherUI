var utils = require('../../utils');
var serverService = require('../../services/server_service');
var bind = require('../../binder');
var tables = require('../../tables');
var transforms = require('../../transforms');
var Promise = require('bluebird');

var ranges = [{value: 0, label:"Today"}, {value:-1, label:"Yesterday"}];
for (var i=2; i < 15; i++) {
    ranges.push({value: -i, label: i + " days ago"});
}
/*
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
*/
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
        .obs('total', 0)
        .obs('title', params.name);

    self.formatLocalDateTime = transforms.formatLocalDateTime;
    self.selectedRangeObs.subscribe(load);

    tables.prepareTable(self, 'upload');

    self.classFor = function(item) {
        switch(item.status) {
            case 'unknown': return 'negative';
            case 'validation_failed': return 'warning';
            //case 'succeeded': return '';
            default: return '';
        }
    };
    self.iconFor = function(item) {
        switch(item.status) {
            case 'unknown': return 'help circle icon';
            case 'validation_in_progress': return 'refresh icon';
            case 'validation_failed': return 'ui yellow text warning sign icon';
            case 'succeeded': return 'ui green text checkmark icon';
            default: return '';
        }
    };
    self.htmlFor = function(data) {
        return /*"<p><b>"+popupTitleFor(data)+"</b></p>" +*/ data.validationMessageList.map(function(error) {
            return "<p>"+error+"</p>";
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
        if (self.pagerLoadingObs()){ return false; }
        var index = getSelectedIndex();
        self.selectedRangeObs(ranges[index+1]);
        return false;
    };
    self.nextDay = function() {
        if (self.pagerLoadingObs()){ return false; }
        var index = getSelectedIndex();
        self.selectedRangeObs(ranges[index-1]);
        return false;
    };
    self.selectRange = function(data, event) {
        if (self.pagerLoadingObs()){ return false; }
        self.selectedRangeObs(data);
        return false;
    };
    self.uploadURL = function(data) {
        return '#/participants/' + self.userIdObs() + '/uploads/' + data.uploadId + '/' + encodeURIComponent(params.name);
    };
    self.renderPopup = function(data) {
        return data.status === 'validation_failed';
    };
    self.toggle = function(model) {
        model.collapsedObs(!model.collapsedObs());
    };
    
    // TODO: This is a candidate for the tables package. Also, it needs a sorting indicator, the css
    // for table-sort.scss is very elegant and simple. It is, however, getting closer to a sorting system 
    // for tables that is friendly to knockout data bindings. Should also be able to look for a 
    // fieldSortValue property on the observed item, and sort by that.
    self.sortCol = function(col) {
        self.itemsObs.__sort = self.itemsObs.__sort || {};
        return function() {
            console.log("sortCol");
            var sort = self.itemsObs.__sort;
            sort[col] = (typeof sort[col] !== "undefined") ? !sort[col] : true;
            var asc = sort[col];
            self.itemsObs.sort(function(item1,item2) {
                var a = item1[col].toLowerCase();
                var b = item2[col].toLowerCase();
                return (asc) ? a.localeCompare(b) : b.localeCompare(a);
            });
        };
    };
    self.refresh = function() {
        if (self.pagerLoadingObs()){ return; }
        load();
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
    function getSelectedIndex() {
        return ranges.indexOf( self.selectedRangeObs() );
    }
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
            item.completedByObs(formatCompletedBy(item));
        }
    }
    function formatCompletedBy(item) {
        var start = new Date(item.requestedOn).getTime();
        var end = new Date(item.completedOn).getTime();
        var fStart = transforms.formatLocalDateTime(item.requestedOn);
        var fEnd = transforms.formatLocalDateTime(item.completedOn);
        if (fStart.split(', ')[0] === fEnd.split(', ')[0]) {
            fEnd = fEnd.split(', ')[1];
        }
        return fEnd+" ("+item.completedBy+", "+transforms.formatMs(end-start)+")";
    }
    function processUploads(response) {
        self.loadedOnceObs(true);
        var dateString = transforms.formatLocalDateTimeWithoutZone(response.startTime).split(" @ ")[0];
        self.dayObs(dateString);
        self.totalObs(response.items.length);
        response.items.map(processItem);
        self.itemsObs(response.items);
        return response;
    }
    function load() {
        self.pagerLoadingObs(true);
        var index = getSelectedIndex();
        var range = utils.getDateRange(ranges[index].value);
        serverService.getParticipantUploads(params.userId, range.startTime, range.endTime)
            .then(processUploads).then(function() {
                self.pagerLoadingObs(false);
            });
    }
    load();
};