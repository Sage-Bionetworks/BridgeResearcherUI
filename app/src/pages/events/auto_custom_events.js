import ko from "knockout";
import serverService from "../../services/server_service";
import utils from "../../utils";

function mapToObservers(entry) {
  let eventKey = entry[0];
  let period = entry[1];
  let originEvent = "enrollment";

  if (period.includes(":")) {
    let lastIndex = period.lastIndexOf(":");
    originEvent = period.substring(0, lastIndex);
    period = period.substring(lastIndex + 1);
  }
  let delta = period.includes("-") ? "before" : "after";
  period = period.replace("-", "");

  return {
    eventKeyObs: ko.observable(eventKey),
    periodObs: ko.observable(period),
    deltaObs: ko.observable(delta),
    originEventObs: ko.observable(originEvent)
  };
}
function obsToMap(accumulator, currentValue) {
  let eventKey = currentValue.eventKeyObs();
  let period = currentValue.periodObs();
  let delta = currentValue.deltaObs();
  let originEvent = currentValue.originEventObs();
  if (delta === "before") {
    period = period.replace("P", "P-");
  }
  if (eventKey && period) {
    accumulator[eventKey] = originEvent + ":" + period;
  }
  return accumulator;
}

export default function() {
  let self = this;

  self.itemsObs = ko.observableArray([]);
  self.allDeltasObs = ko.observableArray([{ label: "before", value: "before" }, { label: "after", value: "after" }]);
  self.allEventsObs = ko.observableArray([
    { label: "enrollment", value: "enrollment" },
    { label: "activities retrieved", value: "activities_retrieved" }
  ]);

  self.save = function(vm, event) {
    self.study.automaticCustomEvents = self.itemsObs().reduce(obsToMap, {});

    utils.startHandler(vm, event);
    serverService
      .saveStudy(self.study, false)
      .then(utils.successHandler(vm, event, "Automatic custom events saved."))
      .catch(utils.failureHandler());
  };
  self.addCustomEvent = function(vm, event) {
    self.itemsObs.push(mapToObservers(["", "P1D"]));
  };

  function activityEventKeyToOpt(key) {
    return { label: key, value: "custom:" + key };
  }

  serverService.getStudy().then(function(study) {
    self.study = study;
    let eventKeys = study.activityEventKeys || [];
    self.allEventsObs.pushAll(eventKeys.map(activityEventKeyToOpt));
    self.itemsObs(
      Object.entries(study.automaticCustomEvents || {})
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(mapToObservers)
    );
  });
};
