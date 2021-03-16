import fn from "../../functions";
import ko from "knockout";

export default function(params) {
  var self = this;

  if (!params.isNewObs) {
    params.isNewObs = ko.observable(false);
  }

  fn.copyProps(self, params, "isNewObs", "createdOnObs", "modifiedOnObs");
  fn.copyProps(self, fn, "formatDateTime");
};
