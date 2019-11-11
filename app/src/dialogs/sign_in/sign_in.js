import Binder from "../../binder";
import BridgeError from "../../bridge_error";
import config from "../../config";
import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";
import storeService from "../../services/store_service";
import toastr from 'toastr';
import utils from "../../utils";

const FAILURE_HANDLER = utils.failureHandler({transient: false});
const ENVIRONMENT = "environment";
const OAUTH_STATE = "synState";
const PHONE_SUCCESS_MSG = "An SMS message has been sent to that phone number; enter the code to sign in.";
const STUDY_KEY = "studyKey";
const SUCCESS_MSG = "An email has been sent to that address with instructions on changing your password.";
const COLLECTING_EMAIL = ['SignIn', 'ForgotPassword'];
const OTHER_THAN_PHONE = ['SignIn', 'ExternalIdSignIn', 'ForgotPassword'];

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

// There will be stale data in the UI if we don't reload when changing studies or environments.
function makeReloader(studyKey, environment) {
  let requiresReload = storeService.get(STUDY_KEY) !== studyKey || storeService.get(ENVIRONMENT) !== environment;
  return requiresReload ? 
    function() {
      storeService.set(STUDY_KEY, studyKey);
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

  let isLocked = fn.isNotBlank(root.queryParams.studyPath);
  const SYNTH_EVENT = { target: document.querySelector("#submitButton") };

  let studyKey, env;
  if (isLocked) {
    studyKey = root.queryParams.studyPath;
    env = "production";
  } else {
    studyKey = storeService.get(STUDY_KEY);
    env = storeService.get(ENVIRONMENT) || "production";
  }
  new Binder(self)
    .obs("state", "SignIn")
    .obs("study", studyKey)
    .obs("environment", env)
    .obs("email")
    .obs("password")
    .obs("phone")
    .obs("phoneRegion", "US")
    .obs("token")
    .obs("imAnAdmin", false)
    .obs("externalId")
    .obs("studyOptions[]")
    .obs("isLocked", isLocked);

  let stateKey = storeService.get(OAUTH_STATE);
  let oauth = (stateKey && stateKey === root.queryParams.state && root.queryParams.code);
  if (oauth) {
    self.stateObs("Oauth");
  }
  function loadStudies(studies) {
    self.studyOptionsObs(studies.items);
    self.studyObs(studyKey);
  }
  function loadStudyList(newValue) {
    if (newValue) {
      return serverService.getStudyList(newValue)
        .then(loadStudies)
        .catch(FAILURE_HANDLER);
    }
  }
  function handleOAuthCallback() { 
    if (!oauth) {
      return;
    }
    let studyKey = storeService.get(STUDY_KEY);
    let environment = storeService.get(ENVIRONMENT);
    let studyName = utils.findStudyName(self.studyOptionsObs(), studyKey);
    storeService.remove(OAUTH_STATE);
    let obj = {study: studyKey, vendorId: 'synapse', 
      authToken: root.queryParams.code, callbackUrl: document.location.origin};
    return serverService.oauthSignIn(studyName, environment, obj)
      .then(() => document.location = '/' + document.location.hash)
      .then(utils.successHandler(self, SYNTH_EVENT))
      .catch((e) => {
        self.stateObs("SignIn");
        toastr.error(e.responseJSON.message);
      });
  }

  function clear(response) {
    self.emailObs("");
    self.externalIdObs("");
    self.passwordObs("");
    self.phoneObs("");
    self.phoneRegionObs("US");
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
    if (payload.phone && payload.phoneRegion) {
      payload.phone = {
        number: payload.phone.replace(/\D/g, ""),
        regionCode: payload.phoneRegion
      };
      delete payload.phoneRegion;
    }
    if (payload.token) {
      payload.token = payload.token.replace(/[^\d]/g, "");
    }
    return payload;
  }
  function collectValues() {
    let studyKey = self.studyObs();
    let environment = self.environmentObs();
    let studyName = utils.findStudyName(self.studyOptionsObs(), studyKey);
    return { studyKey, studyName, environment };
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
  self.submit = function(vm, event) {
    (event || vm).preventDefault();
    let key = self.stateObs();
    let methodName = key.substring(0, 1).toLowerCase() + key.substring(1);
    self[methodName](self, event);
  };
  self.signIn = function(vm, event) {
    let payload = createPayload("email", "password", "study", "environment");
    if (payload) {
      let { studyKey, studyName, environment } = collectValues();
      utils.startHandler(self, SYNTH_EVENT);

      let promise = self.imAnAdminObs() ? 
        serverService.adminSignIn(studyName, environment, payload) : 
        serverService.signIn(studyName, environment, payload);
      promise.then(clear)
        .then(makeReloader(studyKey, environment))
        .then(utils.successHandler(self, SYNTH_EVENT))
        .catch(FAILURE_HANDLER);
    }
  };
  self.forgotPassword = function(vm, event) {
    let payload = createPayload("email", "study");
    if (payload) {
      let { studyKey, studyName, environment } = collectValues();
      utils.startHandler(self, SYNTH_EVENT);
      return serverService.requestResetPassword(environment, payload)
        .then(clear)
        .then(self.cancel)
        .then(utils.successHandler(self, SYNTH_EVENT, SUCCESS_MSG))
        .catch(FAILURE_HANDLER);
    }
  };
  self.enterCode = function(vm, event) {
    let payload = createPayload("token", "phone", "phoneRegion", "study");
    if (payload) {
      self.cancel();
      clear();
      let { studyKey, studyName, environment } = collectValues();
      utils.startHandler(vm, SYNTH_EVENT);
      return serverService.phoneSignIn(studyName, environment, payload)
        .then(clear)
        .then(makeReloader(studyKey, environment))
        .then(utils.successHandler(vm, SYNTH_EVENT))
        .catch(FAILURE_HANDLER);
    }
  };
  self.phoneSignIn = function(vm, event) {
    let payload = createPayload("phone", "phoneRegion", "study");
    if (payload) {
      let { studyKey, studyName, environment } = collectValues();
      utils.startHandler(vm, SYNTH_EVENT);
      return serverService.requestPhoneSignIn(environment, payload)
        .then(self.useCode)
        .then(utils.successHandler(vm, SYNTH_EVENT, PHONE_SUCCESS_MSG))
        .catch(FAILURE_HANDLER);
    }
  };
  self.externalIdSignIn = function(vm, event) {
    let payload = createPayload("externalId", "password", "study");
    if (payload) {
      let { studyKey, studyName, environment } = collectValues();
      utils.startHandler(self, SYNTH_EVENT);
      serverService.signIn(studyName, environment, payload)
        .then(clear)
        .then(makeReloader(studyKey, environment))
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
  self.updateRegion = function(model, event) {
    if (event.target.classList.contains("item")) {
      self.phoneRegionObs(event.target.textContent);
    }
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

    let payload = createPayload('study');
    let studyKey = payload.study;
    let state = new Date().getTime().toString(32);
    storeService.set(STUDY_KEY, studyKey);
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
    self.studyOptionsObs({ name: "Updating...", identifier: "" });
    loadStudyList(newValue);
  });
  loadStudyList(env).then(handleOAuthCallback);  
};
