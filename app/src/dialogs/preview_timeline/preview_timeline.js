import Binder from "../../binder";
import root from "../../root";
import serverService from "../../services/server_service";

export default function(params) {
  let self = this;

  new Binder(self).obs("content");
  self.close = root.closeDialog;

  serverService.getScheduleTimeline(params.scheduleGuid).then(timeline => {
    self.contentObs(JSON.stringify(timeline, null, 2));
  });
};
