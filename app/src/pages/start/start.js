var serverService = require('../../services/server_service');
var ko = require('knockout');
var fn = require('../../functions');
var utils = require('../../utils');

var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var WEEK = 7*1000*60*60*24;
var STUDY_NAME = 'Bridge-Reporter-Scheduler-prod-daily-upload-report';

function dataSet(label, array, color) {
    return {
        label: label,
        data: array,
        fill: false,
        lineWidth: 1,
        backgroundColor: color
    };
}
function formatDate(date) {
    var parts = date.split("-");
    return MONTHS[parseInt(parts[1])-1] + " " + parseInt(parts[2]);
}
function getDateRange(range) {
    var millis = new Date().getTime();
    var rangeOffset = WEEK * parseInt(range);
    return {
        startDate: new Date(millis - rangeOffset).toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0]
    };
}

module.exports = function() {
    var self = this;

    self.isLoadingObs = ko.observable(false);
    self.chartObs = ko.observable();
    self.rangeObs = ko.observable('2');
    self.isActive = function(value) {
        return ko.computed(function() {
            return self.rangeObs() === value;
        });
    };
    self.selectRange = function(vm, event) {
        var rangeNum = event.target.getAttribute('data-range');
        self.rangeObs(rangeNum);
        loadChart(rangeNum);
    };

    function makeChart(response) {
        var labels = [];
        var requested = [];
        var duplicates = [];
        var succeeded = [];
        response.items.forEach(function(item) {
            labels.push(formatDate(item.date));
            succeeded.push(item.data.succeeded || 0);
            requested.push(item.data.requested || 0);
            duplicates.push(item.date.duplicate || 0);
        });
        var max = Math.max.apply(null, succeeded);

        var datasets = [];
        if (Math.max.apply(null,succeeded) > 0) {
            datasets.push(dataSet('Successful', succeeded, 'rgba(75,192,192,1.0)'));
        }
        if (Math.max.apply(null,requested) > 0) {
            datasets.push(dataSet('Failed Attempts', requested, 'rgba(54,162,235,1.0)'));
        }
        if (Math.max.apply(null,duplicates) > 0) {
            datasets.push(dataSet('Duplicates', duplicates, 'rgba(255,206,86,1.0)'));
        }
        var stepSize = Math.pow(10, Math.floor(Math.log10(max)));

        self.chartObs({
            type: 'line',
            data: {labels: labels, datasets: datasets},
            options: {
                title: {text: "Daily Uploads",display: true},
                scales: {
                    yAxes: [{
                        ticks: {
                            fixedStepSize: stepSize, 
                            beginAtZero:true, 
                            suggestedMax: Math.ceil(max*1.1)
                        },
                    }]
                }
            }
        });
    }
    function loadChart(rangeNum) {
        utils.startHandler(self);
        self.isLoadingObs(true);
        var range = getDateRange(rangeNum);
        serverService.getStudyReport(STUDY_NAME, range.startDate, range.endDate)
            .then(fn.handleStaticObsUpdate(self.isLoadingObs, false))
            .then(function(response) {
                if (self.rangeObs() === rangeNum) {
                    makeChart(response);
                }
            })
            .then(utils.successHandler(self))
            .catch(utils.failureHandler());
    }
    loadChart('2');
};