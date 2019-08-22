import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import root from "../../root";
import utils from "../../utils";

export default function(params) {
  let self = this;
  self.closeDialog = root.closeDialog;

  let binder = new Binder(self)
    .bind("vendorId")
    .bind("clientId")
    .bind("secret")
    .bind("endpoint")
    .bind("introspectEndpoint")
    .bind("callbackUrl");

  if (typeof params.index === "number") {
    let op = params.oAuthProvidersObs()[params.index];
    self.vendorIdObs(op.vendorId);
    self.clientIdObs(op.clientId);
    self.secretObs(op.secret);
    self.endpointObs(op.endpoint);
    self.introspectEndpointObs(op.introspectEndpoint);
    self.callbackUrlObs(op.callbackUrl);
  }
  self.save = function() {
    let error = new BridgeError();
    if (!self.vendorIdObs()) {
      error.addError("vendorId", "is required");
    }
    if (!self.clientIdObs()) {
      error.addError("clientId", "is required");
    }
    if (!self.secretObs()) {
      error.addError("secret", "is required");
    }
    if (!self.endpointObs()) {
      error.addError("endpoint", "is required");
    }
    if (!self.callbackUrlObs()) {
      error.addError("callbackUrl", "is required");
    }
    // the introspect endpoint is optional
    if (error.hasErrors()) {
      return utils.failureHandler({ transient: false })(error);
    }
    let op = {
      vendorId: self.vendorIdObs().toLowerCase(),
      clientId: self.clientIdObs(),
      secret: self.secretObs(),
      endpoint: self.endpointObs(),
      introspectEndpoint: self.introspectEndpointObs(),
      callbackUrl: self.callbackUrlObs()
    };
    if (typeof params.index === "number") {
      let oldOp = params.oAuthProvidersObs()[params.index];
      params.oAuthProvidersObs.replace(oldOp, op);
    } else {
      params.oAuthProvidersObs.push(op);
    }
    root.closeDialog();
  };
};
