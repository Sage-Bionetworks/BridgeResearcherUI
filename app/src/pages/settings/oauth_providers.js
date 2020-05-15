import alert from "../../widgets/alerts";
import Binder from "../../binder";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

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
      callbackUrl: obj.callbackUrl,
      introspectEndpoint: obj.introspectEndpoint
    };
    return map;
  }, {});
}

export default function() {
  let self = this;

  let binder = new Binder(self).bind("oAuthProviders[]", [], modelToObs, obsToModel);

  self.save = function(vm, event) {
    self.app = binder.persist(self.app);

    utils.startHandler(vm, event);
    serverService
      .saveApp(self.app)
      .then(utils.successHandler(vm, event, "App information saved."))
      .catch(utils.failureHandler({ id: 'oauth-providers' }));
  };
  self.removeProvider = function(element) {
    alert.deleteConfirmation("Do you want to delete this OAuth provider?", function() {
      self.oAuthProvidersObs.remove(element);
    });
  };
  self.addProvider = function() {
    root.openDialog("oauth_provider", {
      app: self.app,
      oAuthProvidersObs: self.oAuthProvidersObs
    });
  };
  self.editProvider = function(provider) {
    let index = self.oAuthProvidersObs().indexOf(provider);
    root.openDialog("oauth_provider", { index: index, app: self.app, oAuthProvidersObs: self.oAuthProvidersObs });
  };

  serverService.getApp()
    .then(binder.assign("app"))
    .then(binder.update())
    .catch(utils.failureHandler({ id: 'oauth-providers' }));
};
