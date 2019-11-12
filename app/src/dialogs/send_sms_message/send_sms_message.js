import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function(params) {
  let self = this;

  new Binder(self).obs("message", "");

  self.cancel = root.closeDialog;
  self.send = function(vm, event) {
    let template = {
      message: self.messageObs()
    };
    let error = new BridgeError();
    if (template.message === "") {
      error.addError("message", "is required");
    }
    if (error.hasErrors()) {
      return utils.failureHandler({ transient: false, id: 'send-sms-message' })(error);
    }

    utils.startHandler(vm, event);
    serverService
      .sendSmsMessage(params.userId, template)
      .then(utils.successHandler(vm, event, "SMS message has been sent."))
      .then(self.cancel)
      .catch(utils.failureHandler({ transient: false, id: 'send-sms-message' }));
  };
};
