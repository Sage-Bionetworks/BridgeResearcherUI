import fn from "../../functions";

export default function(params) {
  var self = this;

  fn.copyProps(self, params, "isNewObs", "createdOnObs", "modifiedOnObs");
  fn.copyProps(self, fn, "formatDateTime");
};
