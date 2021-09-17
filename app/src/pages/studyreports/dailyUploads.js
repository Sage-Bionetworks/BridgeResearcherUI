import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import utils from "../../utils";
import { getDateRange, makeChart } from "./report_utils";
import { LinearScale } from "chart.js";

const APP_NAME = "Bridge-Reporter-Scheduler-prod-daily-upload-report";

function convertToChartConfig(data) {
  return {
    type: "line",
    data: { labels: data.labels, datasets: data.datasets },
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              fixedStepSize: data.stepSize,
              beginAtZero: true,
              suggestedMax: Math.ceil(data.max * 1.1)
            }
          }
        ]
      }
    }
  };
}

export default function dailyUploads() {
  let self = this;

  self.isLoadingObs = ko.observable(false);
  self.chartObs = ko.observable();
  self.rangeObs = ko.observable("2");
  self.hasDataObs = ko.observable(false);

  self.comps = [];
  self.isActive = function(value) {
    let comp = ko.computed(function() {
      return self.rangeObs() === value;
    });
    self.comps.push(comp);
    return comp;
  };
  self.selectRange = function(vm, event) {
    let rangeNum = event.target.getAttribute("data-range");
    self.rangeObs(rangeNum);
    loadChart(rangeNum);
  };

  const chartMaker = makeChart(
    ['requested', 'duplicate', 'succeeded', 'validation_failed'], 
    ['Failed (Started, Not Finished)', 'Duplicate', 'Successful', 'Failed (Data Invalid)'], 
    // red, gray, green, yellow
    // gray, yellow, green, red
    ['gray', '#fbbd08', '#21ba45', '#db2828'],
    'succeeded', '');

  function loadChart(rangeNum) {
    utils.startHandler(self);
    self.isLoadingObs(true);
    let range = getDateRange(rangeNum);
    serverService.getStudyReport(APP_NAME, range.startDate, range.endDate)
      .then(fn.handleStaticObsUpdate(self.isLoadingObs, false))
      .then(function(response) {
        if (self.rangeObs() === rangeNum) {
          let data = chartMaker(response);
          self.hasDataObs(data.datasets.length > 0);
          self.chartObs(convertToChartConfig(data));
        }
      })
      .then(utils.successHandler(self))
      .catch(utils.failureHandler());
  }
  loadChart("2");
};
dailyUploads.prototype.dispose = function() {
  this.comps.forEach(function(comp) {
    comp.dispose();
  });
};
