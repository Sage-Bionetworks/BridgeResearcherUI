var serverService = require('../../services/server_service');
var ko = require('knockout');

var TWO_WEEKS = 1000*60*60*24*14;

function dataSet(label, array, color) {
    return {
        label: label,
        data: array,
        fill: false,
        lineWidth: 1,
        backgroundColor: color
    };
}

module.exports = function() {
    self.chartObs = ko.observable();

    var startDate = new Date(new Date().getTime() - TWO_WEEKS).toISOString().split("T")[0];
    var endDate = new Date().toISOString().split("T")[0];
    serverService.getStudyReport('Bridge-Reporter-Scheduler-prod-daily-upload-report', startDate, endDate)
        .then(makeChart);

    function makeChart(response) {
        var labels = [];
        var requested = [];
        var duplicates = [];
        var succeeded = [];
        response.items.forEach(function(item) {
            labels.push(new Date(item.date).toLocaleDateString());
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
                title: {display: true, text: "Daily Uploads"},
                scales: {
                    yAxes: [{
                        ticks: {fixedStepSize: stepSize, beginAtZero:true, suggestedMax: Math.ceil(max*1.1)},
                    }]
                }
            }
        });
    }
};