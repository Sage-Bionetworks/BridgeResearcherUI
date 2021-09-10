import root from "../../root";

export default function breadcrumb(params) {
  let self = this;

  self.showBreadcrumb = function() {
    return root.userId !== params.userIdObs();
  }
};
