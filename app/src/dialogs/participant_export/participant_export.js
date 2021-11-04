import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default class ParticipantExport {
  constructor(params) {
    this.studyIdHiddenObs = ko.observable(!!params.studyId);
    this.studyIdObs = ko.observable(params.studyId);
    this.passwordObs = ko.observable();
    this.close = root.closeDialog;
    this.startExport = (vm, event) => {
      let payload = { studyId: this.studyIdObs(), password: this.passwordObs() };
      utils.startHandler(vm, event);
      if (params.studyId) {
        return serverService.emailStudyParticipantRoster(params.studyId, payload)
          .then(utils.successHandler(vm, event, "Participant roster is being prepared."))
          .catch(utils.failureHandler({ id: 'participant_export' }));
      }
      return serverService.emailRoster(payload)
        .then(utils.successHandler(vm, event, "Participant roster is being prepared."))
        .catch(utils.failureHandler({ id: 'participant_export' }));
    }
  }
}
