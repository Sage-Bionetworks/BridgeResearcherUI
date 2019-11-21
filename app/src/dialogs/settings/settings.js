import Binder from "../../binder";
import fn from "../../functions";
import root from "../../root";

export default function(params) {
  let self = this;

  new Binder(self).obs("dateFormatting", localStorage.getItem("timezone") || "local");

  fn.copyProps(self, root, "closeDialog");

  self.save = function() {
    localStorage.setItem("timezone", self.dateFormattingObs());
    setTimeout(() => document.location.reload(), 100);
  };
};
