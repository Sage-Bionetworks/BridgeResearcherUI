import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function(params) {
  let self = this;

  self.cancel = root.closeDialog;
  self.signOutOptionObs = ko.observable("true");

  function signOut(deleteReauthToken) {
    if (params.studyId) {
      return serverService.signOutStudyParticipant(params.studyId, params.userId, deleteReauthToken);
    } else {
      return serverService.signOutUser(params.userId, deleteReauthToken);
    }
  }

  self.signOutUser = function(vm, event) {
    utils.startHandler(vm, event);

    let deleteReauthToken = self.signOutOptionObs() === "true";
    signOut(deleteReauthToken)
      .then(utils.successHandler(vm, event, "User signed out."))
      .then(self.cancel)
      .catch(utils.failureHandler({id: 'sign-out-user'}));
  };
};
