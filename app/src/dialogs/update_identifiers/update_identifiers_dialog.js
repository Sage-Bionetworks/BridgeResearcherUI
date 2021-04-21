import Binder from "../../binder";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function(params) {
  let self = this;

  new Binder(self)
    .obs("signInEmail")
    .obs("signInPassword")
    .obs("email", params.email)
    .obs("synapseUserId", params.synapseUserId)
    .obs("phone")
    .obs("credentialType", "Email")
    .obs("externalId");

  function updateSynapseUserId(payload) {
    let value = self.synapseUserIdObs();
    if (value === '' || /^\d+$/.test(value)) {
      return Promise.resolve();
    }
    return utils.synapseAliasToUserId(value).then((id) => {
      payload.synapseUserIdUpdate = id;
      self.synapseUserIdObs(id);
    });
  }
  self.isVisible = function(field) {
    return params.editor === field;
  }

  self.save = function(vm, event)  {
    utils.startHandler(vm, event);

    const payload = {
      signIn: { appId: params.appId, password: self.signInPasswordObs() },
    };
    if (self.credentialTypeObs() === 'Email') {
      payload.signIn.email = self.signInEmailObs();
    } else if (self.credentialTypeObs() === 'External ID') {
      payload.signIn.externalId = self.externalIdObs();
    } else if (self.credentialTypeObs() === 'Phone') {
      payload.signIn.phone = self.phoneObs();
    }
    if (self.isVisible('email')) {
      payload.emailUpdate = self.emailObs();
    }
    if (self.isVisible('synapseUserId')) {
      payload.synapseUserIdUpdate = new String(self.synapseUserIdObs());
    }
    if (self.isVisible('phone')) {
      payload.phoneUpdate = self.phoneObs();
    }
    updateSynapseUserId(payload)
      .then(() => serverService.updateIdentifiersForSelf(payload))
      .then(() => document.location.reload())
      .catch(utils.failureHandler({id: 'update-identifiers-dialog'}));
  };
  self.cancel = params.closeDialog;
};
