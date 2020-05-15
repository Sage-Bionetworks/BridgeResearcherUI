import ko from "knockout";
import root from "../../root";
import utils from "../../utils";

export default function(params /*userId, vm, closeMethod, subpopGuid */) {
  let self = this;

  self.reasonObs = ko.observable();
  self.cancel = root.closeDialog;
  self.title = params.subpopGuid ? "Withdraw from consent group" : "Withdraw user from all studies in the app";

  self.withdraw = function(vm, event) {
    utils.startHandler(vm, event);
    params.vm[params.closeMethod](self.reasonObs(), params.subpopGuid);
  };
};
