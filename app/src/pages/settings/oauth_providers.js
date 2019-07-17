import alert from "../../widgets/alerts";
import Binder from "../../binder";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

// This is a trivial change because Travis doesn't seem to think the branch is there for deployment.

function modelToObs(map, context) {
  return Object.keys(map || {}).map(function(vendorId) {
    let obj = map[vendorId];
    obj.vendorId = vendorId;
    return obj;
  });
}
function obsToModel(array) {
  return array.reduce(function(map, obj) {
    map[obj.vendorId] = {
      clientId: obj.clientId,
      secret: obj.secret,
      endpoint: obj.endpoint,
      callbackUrl: obj.callbackUrl
    };
    return map;
  }, {});
}

export default function() {
  let self = this;

  let binder = new Binder(self).bind("oAuthProviders[]", [], modelToObs, obsToModel);

  self.save = function(vm, event) {
    self.study = binder.persist(self.study);

    utils.startHandler(vm, event);
    serverService
      .saveStudy(self.study)
      .then(utils.successHandler(vm, event, "Study information saved."))
      .catch(utils.failureHandler());
  };
  self.removeProvider = function(element) {
    alert.deleteConfirmation("Do you want to delete this OAuth provider?", function() {
      self.oAuthProvidersObs.remove(element);
    });
  };
  self.addProvider = function() {
    root.openDialog("oauth_provider", {
      study: self.study,
      oAuthProvidersObs: self.oAuthProvidersObs
    });
  };
  self.editProvider = function(provider) {
    let index = self.oAuthProvidersObs().indexOf(provider);
    root.openDialog("oauth_provider", { index: index, study: self.study, oAuthProvidersObs: self.oAuthProvidersObs });
  };

  serverService
    .getStudy()
    .then(binder.assign("study"))
    .then(binder.update())
    .catch(utils.failureHandler());
};
