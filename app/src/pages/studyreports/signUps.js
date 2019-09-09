import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import utils from "../../utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK = 7 * 1000 * 60 * 60 * 24;
const STUDY_NAME = "SignUp-Report-Prod-daily-signups-report";

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
  let parts = date.split("-");
  return MONTHS[parseInt(parts[1]) - 1] + " " + parseInt(parts[2]);
}
function getDateRange(range) {
  let millis = new Date().getTime();
  let rangeOffset = WEEK * parseInt(range);
  return {
    startDate: fn.formatDate(new Date(millis - rangeOffset), "iso"),
    endDate: fn.formatDate(null, "iso")
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

  function makeChart(response) {
    let labels = [];
    let enabled = [];
    let disabled = [];
    let unverified = [];
    response.items.forEach(function(item) {
      labels.push(formatDate(item.date));
      enabled.push(item.data.byStatus.enabled || 0);
      disabled.push(item.data.byStatus.disabled || 0);
      unverified.push(item.data.byStatus.unverified || 0);
    });
    let max = Math.max.apply(null, enabled);

    let datasets = [];
    if (Math.max.apply(null, enabled) > 0) {
      datasets.push(dataSet("Enabled", enabled, "#21ba45"));
    }
    if (Math.max.apply(null, disabled) > 0) {
      datasets.push(dataSet("Disabled", disabled, "#6435c9"));
    }
    if (Math.max.apply(null, unverified) > 0) {
      datasets.push(dataSet("Unverified", unverified, "#db2828"));
    }
    let stepSize = Math.pow(10, Math.floor(Math.log10(max)));
    console.log(stepSize);
    self.hasDataObs(datasets.length > 0);

    self.chartObs({
      type: "line",
      data: { labels: labels, datasets: datasets },
      options: {
        precision: 0,
        scales: {
          yAxes: [
            {
              ticks: {
                fixedStepSize: stepSize,
                beginAtZero: true,
                suggestedMax: Math.ceil(max * 1.1),
                userCallback: function(label, index, labels) {
                  return (Math.floor(label) === label) ? label: null;
                }
              }
            }
          ]
        }
      }
    });
  }
  function loadChart(rangeNum) {
    utils.startHandler(self);
    self.isLoadingObs(true);
    let range = getDateRange(rangeNum);
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
  loadChart("2");
};
dailyUploads.prototype.dispose = function() {
  this.comps.forEach(function(comp) {
    comp.dispose();
  });
};
