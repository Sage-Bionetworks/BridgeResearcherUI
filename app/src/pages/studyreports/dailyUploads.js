import * as fn from '../../functions';
import * as ko from 'knockout';
import serverService from '../../services/server_service';
import utils from '../../utils';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEK = 7*1000*60*60*24;
const STUDY_NAME = 'Bridge-Reporter-Scheduler-prod-daily-upload-report';

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
    self.hasDataObs = ko.observable(false);

    self.comps = [];
    self.isActive = function(value) {
        var comp = ko.computed(function() {
            return self.rangeObs() === value;
        });
        self.comps.push(comp);
        return comp;
    };
    self.selectRange = function(vm, event) {
        var rangeNum = event.target.getAttribute('data-range');
        self.rangeObs(rangeNum);
        loadChart(rangeNum);
    };

    function makeChart(response) {
        var labels = [];
        var requested = [];
        var duplicate = [];
        var succeeded = [];
        var validation_failed = [];
        response.items.forEach(function(item) {
            labels.push(formatDate(item.date));
            succeeded.push(item.data.succeeded || 0);
            requested.push(item.data.requested || 0);
            duplicate.push(item.data.duplicate || 0);
            validation_failed.push(item.data.validation_failed || 0);
        });
        var max = Math.max.apply(null, succeeded);

        var datasets = [];
        if (Math.max.apply(null,succeeded) > 0) {
            datasets.push(dataSet('Successful', succeeded, '#21ba45'));
        }
        if (Math.max.apply(null,requested) > 0) {
            datasets.push(dataSet('Failed (Started, Not Finished)', requested, '#6435c9'));
        }
        if (Math.max.apply(null,validation_failed) > 0) {
            datasets.push(dataSet('Failed (Data Invalid)', validation_failed, '#db2828'));
        }
        if (Math.max.apply(null,duplicate) > 0) {
            datasets.push(dataSet('Duplicates', duplicate, '#fbbd08'));
        }
        var stepSize = Math.pow(10, Math.floor(Math.log10(max)));

        self.hasDataObs(datasets.length > 0);

        self.chartObs({
            type: 'line',
            data: {labels: labels, datasets: datasets},
            options: {
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
module.exports.prototype.dispose = function() {
    this.comps.forEach(function(comp) {
        comp.dispose();
    });
};
