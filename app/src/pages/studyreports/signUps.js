import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import utils from "../../utils";
import { getDateRange, makeChart } from "./report_utils";

const APP_NAME = "SignUp-Report-Prod-daily-signups-report";

function convertToChartConfig(data) {
  return {
    type: "line",
    data: { labels: data.labels, datasets: data.datasets },
    options: {
      precision: 0,
      scales: {
        yAxes: [
          {
            ticks: {
              fixedStepSize: data.stepSize,
              beginAtZero: true,
              suggestedMax: Math.ceil(data.max * 1.1),
              userCallback: function(label) {
                return (Math.floor(label) === label) ? label: null;
              }
            }
          }
        ]
      }
    }
  };
}

export default function signUps() {
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
    ['enabled', 'disabled', 'unverified'], 
    ['Enabled', 'Disabled', 'Unverified'], 
    ['#21ba45', '#6435c9', '#db2828'], 
    'enabled', '.byStatus');

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
signUps.prototype.dispose = function() {
  this.comps.forEach(function(comp) {
    comp.dispose();
  });
};
