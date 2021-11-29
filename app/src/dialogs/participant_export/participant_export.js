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
  }
  startExport(vm, event) {
    let studyId = this.studyIdObs();
    let payload = { studyId, password: this.passwordObs() };
    utils.startHandler(vm, event);
    let call = (studyId) ?
      serverService.emailStudyParticipantRoster(studyId, payload) :
      serverService.emailRoster(payload);
    return call.then(utils.successHandler(vm, event, "Participant roster is being prepared."))
        .then(() => this.passwordObs(''))
        .catch(utils.failureHandler({ id: 'participant_export' }));
  }
}
