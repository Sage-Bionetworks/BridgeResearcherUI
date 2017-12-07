import Binder from '../../binder';
import BridgeError from '../../bridge_error';
import fn from '../../functions';
import root from '../../root';
import utils from '../../utils';

module.exports = function(params) {
    var self = this;
    self.closeDialog = root.closeDialog;

    var binder = new Binder(self)
        .bind('vendorId')
        .bind('clientId')
        .bind('secret')
        .bind('endpoint')
        .bind('callbackUrl');

    if (typeof params.index === "number") {
        var op = params.oAuthProvidersObs()[params.index];
        self.vendorIdObs(op.vendorId);
        self.clientIdObs(op.clientId);
        self.secretObs(op.secret);
        self.endpointObs(op.endpoint);
        self.callbackUrlObs(op.callbackUrl);
    }
    self.save = function(){
        var error = new BridgeError();
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
        if (error.hasErrors()) {
            return utils.failureHandler({transient:false})(error);
        }
        var op = {
            'vendorId': self.vendorIdObs().toLowerCase(),
            'clientId': self.clientIdObs(),
            'secret': self.secretObs(),
            'endpoint': self.endpointObs(),
            'callbackUrl': self.callbackUrlObs()
        };
        if (typeof params.index === "number") {
            var oldOp = params.oAuthProvidersObs()[params.index];
            params.oAuthProvidersObs.replace(oldOp,op);
        } else {
            params.oAuthProvidersObs.push(op);
        }
        root.closeDialog();
    };
};
