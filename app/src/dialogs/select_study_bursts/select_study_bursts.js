import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function(params) {
  let self = this;

  // allStudyBurstIds: ids,
  // studyBurstIdsObs: self.studyBurstIdsObs
  let selectedStudyBurstIds = params.studyBurstIdsObs();
  let items = params.allStudyBurstIds.filter(id => !!id).map(id => {
    return {
      identifier: id,
      checkedObs: ko.observable(selectedStudyBurstIds.indexOf(id) > -1)
    };
  });
  self.itemsObs = ko.observableArray(items);

  self.select = function() {
    let selected = self.itemsObs().filter(el => el.checkedObs()).map(el => el.identifier);
    params.studyBurstIdsObs(selected);
    root.closeDialog();
  }
  self.cancel = root.closeDialog;
};
