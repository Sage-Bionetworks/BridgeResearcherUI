import $ from "jquery";
import alerts from "./widgets/alerts";
import config from "./config";
import fn from "./functions";
import ko from "knockout";
import root from "./root";
import router from "./routes";
import toastr from "toastr";
import serverService from "./services/server_service";
import { ERROR_BUS } from './widgets/errors/errors';

const FAILURE_HANDLER = failureHandler({ transient: true });
const GENERIC_ERROR = "A server error happened. We don't know what exactly. Please try again.";
const TIMEOUT_ERROR = "The request timed out. Please verify you have an internet connection, and try again.";
const ROLE_ERROR = "You do not appear to be a developer, researcher, or admin.";
const PERM_ERROR = "You do not have permissions to perform that action.";
const NETWORK_ERROR = "A network error occurred. Please verify you have an internet connection, and try again.";

const statusHandlers = {
  0: localError,
  400: badResponse,
  401: badResponse,
  403: notAllowed,
  404: notFound,
  409: badResponse,
  412: notAdmin,
  500: serverError
};

let pendingControl = null;
toastr.options = config.toastr;

function resolveDerivedFrom(response) {
  response.items.forEach((item) => {
    item.originGuidObs = ko.observable(item.originGuid);
    if (item.originGuid) {
      serverService.getSharedAssessment(item.originGuid)
        .then(shared => item.originGuidObs(
          `<a target="_blank" href="/sharedassessments/${shared.guid}">${shared.title}</a> (rev.${shared.revision})`));
    }
  });
  return response;
}
function notAllowed(response, params) {
  let payload = response.responseJSON || {};
  let message = payload.message || PERM_ERROR;
  if (params.redirect === false) {
    toastr.error(message);
  } else {
    router.setRoute('/reports/uploads');
    setTimeout(function() {
      toastr.error(message);
    }, 200);
  }
}
function badResponse(response, params) {
  // If the error does not return JSON, we have to hunt around for what happened,
  // and that gets sorted out here.
  let payload = response.responseJSON || {};
  payload.message = payload.message || response.responseText;
  payload.id = params.id;
  payload.errors = payload.errors || {};
  ERROR_BUS.emit('showErrors', payload);
}
function localError(response) {
  if (response.statusText === "timeout") {
    toastr.error(TIMEOUT_ERROR);
  } else if (response.status === 0) {
    toastr.error(NETWORK_ERROR);
  } else {
    toastr.error(GENERIC_ERROR);
  }
}
function notAdmin(response) {
  toastr.error(ROLE_ERROR);
}
function notFound(response, params) {
  if (params.redirectTo) {
    router.setRoute(params.redirectTo);
    console.log(response);
    let msg = params.redirectMsg || response.responseJSON.message;
    setTimeout(() => toastr.warning(msg), 500);
  } else {
    badResponse(response, params);
  }
}
function serverError(response) {
  toastr.error(JSON.stringify(response.responseJSON.message));
}
function errorMessageHandler(message, params) {
  if (params.transient) {
    toastr.error(message);
  } else {
    let payload = { message: message, id: params.id };
    ERROR_BUS.emit('showErrors', payload);
  }
}
function statusNotHandled(res) {
  console.error("Response code not handled", res.status);
}
/**
 * params:
 *  transient: boolean, default: true
 *  redirect: do redirect, default: true
 *  redirectTo: string, default null
 *  redirectMsg: message
 *  scrollTo: scrollTo function to execute.
 */
function failureHandler(params = {}) {
  return function(response) {
    clearPendingControl();

    ERROR_BUS.emit('clearErrors');
    if (typeof response === "string") {
      errorMessageHandler(response, params);
    } else if (fn.is(response.status, "Number")) {
      let handler = statusHandlers[response.status] || statusNotHandled;
      handler(response, params);
    } else if (response.message) {
      errorMessageHandler(response.message, params);
    } else {
      console.error("Response object not handled", response);
    }
    if (params.scrollTo) {
      scrollTo(1);
    }
  }
}

function makeOptionFinder(arrayOrObs) {
  return function(value) {
    let options = ko.unwrap(arrayOrObs);
    for (let i = 0; i < options.length; i++) {
      let option = options[i];
      if (option.value === value) {
        return option;
      }
    }
  };
}
function makeOptionLabelFinder(arrayOrObs) {
  let finder = makeOptionFinder(arrayOrObs);
  return function(value) {
    let option = finder(value);
    return option ? option.label : "";
  };
}
function displayPendingControl(control) {
  clearPendingControl();
  control.classList.add("loading");
  pendingControl = control;
}
function clearPendingControl() {
  if (pendingControl) {
    pendingControl.classList.remove("loading");
    pendingControl = null;
  }
}
function copyString(value) {
  let p = document.createElement("textarea");
  p.style = "position:fixed;top:0;left:0";
  p.value = value;
  document.body.appendChild(p);
  p.select();
  if (document.execCommand && document.execCommand("copy")) {
    toastr.success("Copied: " + value);
  } else {
    toastr.error("Could not copy value.");
  }
  document.body.removeChild(p);
}
function findAppName(apps, appId) {
  try {
    return (apps || []).filter(function(appOption) {
      return appOption.identifier === appId;
    })[0].name;
  } catch (e) {
    return "App '" + appId + "' not found.";
  }
}
function startHandler(vm, event, seekButton) {
  if (event && event.target) {
    let btn = event.target;
    while(seekButton && btn && !btn.classList.contains(seekButton)) {
      btn = btn.parentNode;
    }
    displayPendingControl(btn);
  }
  ERROR_BUS.emit('clearErrors');
}
function successHandler(vm, event, message) {
  return function(response) {
    clearPendingControl();
    ERROR_BUS.emit('clearErrors');
    if (message) {
      toastr.success(message);
    }
    return response;
  };
}
function clearErrors() {
  clearPendingControl();
  ERROR_BUS.emit('clearErrors');
}
function makeScrollTo(itemSelector) {
  return function scrollTo(index) {
    let offset = $(".fixed-header").outerHeight() * 1.75;
    let $scrollbox = $(".scrollbox");
    let $element = $scrollbox.find(itemSelector).eq(index);
    if ($scrollbox.length && $element.length) {
      $scrollbox.scrollTo($element, { offsetTop: offset });
      setTimeout(function() {
        $element
          .find(".focus")
          .focus()
          .click();
      }, 20);
    }
  };
}
function createParticipantForID(identifier, password) {
  return {
    externalId: identifier,
    password: password,
    sharingScope: "all_qualified_researchers"
  };
}
function fadeUp() {
  return function(div) {
    if (div.nodeType === 1) {
      let $div = $(div);
      $div.slideUp(function() {
        $div.remove();
      });
    }
  };
}
// TODO: Can we consolidate with fadeRemove binding?
function animatedDeleter(scrollTo, elementsObs, selectedElementObs) {
  return function(element, event) {
    event.stopPropagation();
    alerts.deleteConfirmation("Are you sure you want to delete this?", function() {
      setTimeout(function() {
        let index = elementsObs.indexOf(element);
        elementsObs.splice(index, 1);
        setTimeout(function() {
          if (selectedElementObs) {
            selectedElementObs(index);
          } else {
            scrollTo(index);
          }
        }, 300);
      }, 500);
    });
  };
}

function synapseAliasToUserId(alias) {
  if (!alias) {
    return Promise.resolve(alias);
  }
  alias = alias.replace('@synapse.org', '').trim();
  if (/^\d+$/.test(alias)) {
    return Promise.resolve(alias);
  }
  return fetch('https://repo-prod.prod.sagebase.org/repo/v1/principal/alias', {
    method: 'POST',
    mode: 'cors',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({"alias": alias, "type": "USER_NAME"})
  }).then(response => {
    return response.json().then((json) => {
      return Promise.resolve(json.principalId);
    })
  });
}

export default {
  clearErrors,
  /**
   * A start handler called before a request to the server is made. All errors are cleared
   * and a loading indicator is shown. This is not done globally because some server requests
   * happen in the background and don't signal to the user that they are occurring.
   * @param vm
   * @param event
   */
  startHandler,
  /**
   * An Ajax success handler for a view model that supports the editing of a form.
   * Turns off the loading indicator on the button used to submit the form, and
   * clears error fields.
   * @param vm
   * @param event
   * @returns {Function}
   */
  successHandler,
  clearPendingControl,
  /**
   * Given an array of option objects (with the properties "label" and "value"),
   * return a function that will return a specific option given a value.
   * @param options array or observableArray
   * @returns {Function}
   */
  makeOptionFinder,
  /**
   * Given an array of option objects (with the properties "label" and "value"),
   * return a function that will return an option label given a value.
   * @param options array or observableArray
   * @returns {Function}
   */
  makeOptionLabelFinder,
  /**
   * The logic for the scrollbox scrolling is not idea so isolate it here where we
   * can fix it everywhere it is used.
   * @param itemSelector
   * @returns {scrollTo}
   */
  makeScrollTo,
  fadeUp,
  createParticipantForID,
  animatedDeleter,
  findAppName,
  copyString,
  failureHandler,
  synapseAliasToUserId,
  resolveDerivedFrom
};
