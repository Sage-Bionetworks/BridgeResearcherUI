import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import config from "../../config";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import storeService from "../../services/store_service";
import utils from "../../utils";

const FAILURE_HANDLER = utils.failureHandler({transient: false, id: 'sign-in'});
const ENVIRONMENT = "environment";
const OAUTH_STATE = "synState";
const PHONE_SUCCESS_MSG = "An SMS message has been sent to that phone number; enter the code to sign in.";
const APP_KEY = "appKey";
const SUCCESS_MSG = "An email has been sent to that address with instructions on changing your password.";
const COLLECTING_EMAIL = ['SignIn', 'ForgotPassword'];
const OTHER_THAN_PHONE = ['SignIn', 'ExternalIdSignIn', 'ForgotPassword'];
const SIGNIN_OPTIONS = ['SignIn', 'ExternalIdSignIn', 'PhoneSignIn'];

const TITLES = {
  EnterCode: "Enter Code",
  ExternalIdSignIn: "Sign In",
  ForgotPassword: "Forgot Password",
  PhoneSignIn: "Sign In",
  SignIn: "Sign In",
  Oauth: "Authenticating..."
};
const BUTTONS = {
  EnterCode: "Sign In",
  ExternalIdSignIn: "Sign In",
  ForgotPassword: "Send Email",
  PhoneSignIn: "Send Text Message",
  SignIn: "Sign In",
  Oauth: ""
};

// There will be stale data in the UI if we don't reload when changing apps or environments.
function makeReloader(appKey, environment) {
  let requiresReload = storeService.get(APP_KEY) !== appKey || storeService.get(ENVIRONMENT) !== environment;
  return requiresReload ? 
    function() {
      storeService.set(APP_KEY, appKey);
      storeService.set(ENVIRONMENT, environment);
      root.closeDialog();
      window.location.reload();
    } : 
    function() {
      root.closeDialog();
    };
}

export default function() {
  let self = this;

  let isLocked = fn.isNotBlank(root.queryParams.appId);
  const SYNTH_EVENT = { target: document.querySelector("#submitButton") };

  let appKey, env;
  if (isLocked) {
    appKey = root.queryParams.appId;
    env = "production";
  } else {
    appKey = storeService.get(APP_KEY);
    env = storeService.get(ENVIRONMENT) || "production";
  }
  new Binder(self)
    .obs("state", "SignIn")
    .obs("appId", appKey)
    .obs("environment", env)
    .obs("email")
    .obs("password")
    .obs("phone")
    .obs("token")
    .obs("imAnAdmin", false)
    .obs("externalId")
    .obs("appOptions[]")
    .obs("isLocked", isLocked);

  let stateKey = storeService.get(OAUTH_STATE);
  let oauth = (stateKey && stateKey === root.queryParams.state && root.queryParams.code);
  if (oauth) {
    self.stateObs("Oauth");
  }
  function loadApps(apps) {
    self.appOptionsObs(apps.items);
    self.appIdObs(appKey);
  }
  function loadAppList(newValue) {
    if (newValue) {
      return serverService.getAppList(newValue)
        .then(loadApps)
        .catch(FAILURE_HANDLER);
    }
  }
  function handleOAuthCallback() { 
    if (!oauth) {
      return;
    }
    let appKey = storeService.get(APP_KEY);
    let environment = storeService.get(ENVIRONMENT);
    let appName = utils.findAppName(self.appOptionsObs(), appKey);
    storeService.remove(OAUTH_STATE);
    let obj = {appId: appKey, vendorId: 'synapse', 
      authToken: root.queryParams.code, callbackUrl: document.location.origin};
    return serverService.oauthSignIn(appName, environment, obj)
      .then(() => document.location = '/' + document.location.hash)
      .then(utils.successHandler(self, SYNTH_EVENT))
      .catch((e) => {
        self.stateObs("SignIn");
        FAILURE_HANDLER(e);
      });
  }

  function clear(response) {
    self.emailObs("");
    self.externalIdObs("");
    self.passwordObs("");
    self.phoneObs(null);
    self.tokenObs("");
    return response;
  }
  function createPayload(...fields) {
    let error = new BridgeError();
    let payload = {};
    fields.forEach(field => {
      payload[field] = self[field + "Obs"]();
      if (!payload[field]) {
        error.addError(field, "is required");
      }
    });
    if (error.hasErrors()) {
      return FAILURE_HANDLER(error);
    }
    if (payload.token) {
      payload.token = payload.token.replace(/[^\d]/g, "");
    }
    return payload;
  }
  function collectValues() {
    let appKey = self.appIdObs();
    let environment = self.environmentObs();
    let appName = utils.findAppName(self.appOptionsObs(), appKey);
    return { appKey, appName, environment };
  }
  self.isOtherThanPhone = ko.computed(() => {
    return OTHER_THAN_PHONE.includes(self.stateObs());
  });
  self.isCollectingEmail = ko.computed(() => {
    return COLLECTING_EMAIL.includes(self.stateObs());
  });
  self.isState = function(state) {
    return self.stateObs() === state;
  };
  self.cycleCredentials = function(vm, event) {
    var index = SIGNIN_OPTIONS.indexOf(self.stateObs());
    if (++index > (SIGNIN_OPTIONS.length-1)) {
      index = 0;
    }
    self.stateObs(SIGNIN_OPTIONS[index]);
  };
  self.submit = function(vm, event) {
    (event || vm).preventDefault();
    let key = self.stateObs();
    let methodName = key.substring(0, 1).toLowerCase() + key.substring(1);
    self[methodName](self, event);
  };
  self.signIn = function(vm, event) {
    let payload = createPayload("email", "password", "appId", "environment");
    if (payload) {
      let { appKey, appName, environment } = collectValues();
      utils.startHandler(self, SYNTH_EVENT);

      let promise = self.imAnAdminObs() ? 
        serverService.adminSignIn(appName, environment, payload) : 
        serverService.signIn(appName, environment, payload);
      promise.then(clear)
        .then(makeReloader(appKey, environment))
        .then(utils.successHandler(self, SYNTH_EVENT))
        .catch(FAILURE_HANDLER);
    }
  };
  self.forgotPassword = function(vm, event) {
    let payload = createPayload("email", "appId");
    if (payload) {
      let { appKey, appName, environment } = collectValues();
      utils.startHandler(self, SYNTH_EVENT);
      return serverService.requestResetPassword(environment, payload)
        .then(clear)
        .then(self.cancel)
        .then(utils.successHandler(self, SYNTH_EVENT, SUCCESS_MSG))
        .catch(FAILURE_HANDLER);
    }
  };
  self.enterCode = function(vm, event) {
    let payload = createPayload("token", "phone", "appId");
    if (payload) {
      self.cancel();
      clear();
      let { appKey, appName, environment } = collectValues();
      utils.startHandler(vm, SYNTH_EVENT);
      return serverService.phoneSignIn(appName, environment, payload)
        .then(clear)
        .then(makeReloader(appKey, environment))
        .then(utils.successHandler(vm, SYNTH_EVENT))
        .catch(FAILURE_HANDLER);
    }
  };
  self.phoneSignIn = function(vm, event) {
    let payload = createPayload("phone", "appId");
    if (payload) {
      let { appKey, appName, environment } = collectValues();
      utils.startHandler(vm, SYNTH_EVENT);
      return serverService.requestPhoneSignIn(environment, payload)
        .then(self.useCode)
        .then(utils.successHandler(vm, SYNTH_EVENT, PHONE_SUCCESS_MSG))
        .catch(FAILURE_HANDLER);
    }
  };
  self.externalIdSignIn = function(vm, event) {
    let payload = createPayload("externalId", "password", "appId");
    if (payload) {
      let { appKey, appName, environment } = collectValues();
      utils.startHandler(self, SYNTH_EVENT);
      serverService.signIn(appName, environment, payload)
        .then(clear)
        .then(makeReloader(appKey, environment))
        .then(utils.successHandler(self, SYNTH_EVENT))
        .catch(FAILURE_HANDLER);
    }
  };
  self.usePhone = function(vm, event) {
    utils.clearErrors();
    self.stateObs("PhoneSignIn");
  };
  self.useExternalId = function(vm, event) {
    utils.clearErrors();
    self.stateObs("ExternalIdSignIn");
  };
  self.useForgotPassword = function() {
    utils.clearErrors();
    self.stateObs("ForgotPassword");
  };
  self.cancel = function() {
    utils.clearErrors();
    self.stateObs("SignIn");
  };
  self.useCode = function() {
    utils.clearErrors();
    self.stateObs("EnterCode");
  };
  self.titleObs = ko.computed(() => TITLES[self.stateObs()]);
  self.buttonTextObs = ko.computed(() => BUTTONS[self.stateObs()]);

  function getClientId() {
    if (document.location.origin.indexOf('127.0.0.1') > -1) {
      return config.client.local;
    } else if (document.location.origin.indexOf('-staging') > -1) {
      return config.client.staging;
    }
    return config.client.production;
  }

  self.synapse = function(vm, event) {
    event.stopPropagation();
    event.preventDefault();

    let payload = createPayload('appId');
    let appKey = payload.appId;
    let state = new Date().getTime().toString(32);
    storeService.set(APP_KEY, appKey);
    storeService.set(OAUTH_STATE, state);
    storeService.set(ENVIRONMENT, self.environmentObs());
    let array = [];
    array.push('response_type=code');
    array.push('client_id=' + getClientId());
    array.push('scope=openid');
    array.push('state=' + encodeURIComponent(state));
    array.push('redirect_uri=' + encodeURIComponent(document.location.origin));
    array.push('claims=' + encodeURIComponent('{"id_token":{"userid":null}}'));
    document.location = 'https://signin.synapse.org/?' + array.join('&');
  }
  self.handleFocus = function(focusOnState) {
    return ko.computed(function() {
      return focusOnState === self.stateObs();
    });
  };
  self.environmentOptions = config.environments;
  self.environmentObs.subscribe(function(newValue) {
    self.appOptionsObs({ name: "Updating...", identifier: "" });
    loadAppList(newValue);
  });
  loadAppList(env).then(handleOAuthCallback);  
};
