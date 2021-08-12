import Binder from "../../binder";
import root from "../../root";
import serverService from "../../services/server_service";

export default function(params) {
  let self = this;

  new Binder(self).obs("content");
  self.close = root.closeDialog;

  // When editing schedules as top-level domain models, we have the getScheduleTimeline
  // call, but that is going away in favor of the call to get a timeline via the study.
  if (params.studyId) {
    serverService.getStudyScheduleTimeline(params.studyId).then(timeline => {
      self.contentObs(JSON.stringify(timeline, null, 2));
    });
  } else {
    serverService.getScheduleTimeline(params.scheduleGuid).then(timeline => {
      self.contentObs(JSON.stringify(timeline, null, 2));
    });
  }
};
