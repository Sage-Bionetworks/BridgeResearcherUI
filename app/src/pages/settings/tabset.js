import fn from "../../functions";
import root from "../../root";

export default function tabset(params) {
  let self = this;

  fn.copyProps(self, root, "isAdmin");
};
