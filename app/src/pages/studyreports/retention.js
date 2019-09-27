import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import utils from "../../utils";

const STUDY_NAME = "-daily-retention-report";

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

export default function retention() {
  let self = this;

  let dd = new Date();
  dd.setDate(dd.getDate()-1)
  const DATE = dd.toISOString().split("T")[0];

  self.isLoadingObs = ko.observable(false);
  self.chartObs = ko.observable();
  self.hasDataObs = ko.observable(false);

  const chartMaker = (response) => {
    let labels = ['Daily Sign Ins', 'Daily Uploads'];
    let stepSize = 10;
    let labelArray = [];
    let max = Math.max(
      Math.max.apply(null, response.bySignIn), 
      Math.max.apply(null, response.byUploadedOn));
    let maxArraySize = Math.max(response.bySignIn.length, response.byUploadedOn.length);
    for (let i=0; i < maxArraySize; i++) {
      labelArray.push(i+'');
    } 
    let datasets = [
      {
        label: "Daily Sign Ins",
        data: response.bySignIn,
        fill: false,
        lineWidth: 1,
        pointRadius: (max > 50) ? 1 : 2,
        backgroundColor: 'violet'
      },
      {
        label: "Daily Uploads",
        data: response.byUploadedOn,
        fill: false,
        lineWidth: 1,
        pointRadius: (max > 50) ? 1 : 2,
        backgroundColor: 'teal'
      }      
    ];
    return {labels, datasets, stepSize, labels: labelArray, max}
  };

  function loadChart() {
    utils.startHandler(self);
    self.isLoadingObs(true);
    serverService.getStudyReport(STUDY_NAME, DATE, DATE)
      .then(fn.handleStaticObsUpdate(self.isLoadingObs, false))
      .then(function(response) {
        let data = chartMaker(response.items[0].data);
        self.hasDataObs(data.datasets.length > 0);
        self.chartObs(convertToChartConfig(data));
      })
  }
  loadChart();
};
