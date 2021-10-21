import ko from "knockout";
import root from "../../root";

// Just show the response to a call as formatted JSON.
export default class PreviewDialog {
  constructor(params) {
    this.title = params.title;
    this.contentObs = ko.observable();
    this.close = root.closeDialog;
    params.supplier().then(res => this.contentObs(JSON.stringify(res, null, 2)));
  }
}
