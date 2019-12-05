import ko from 'knockout';
import toastr from 'toastr';
import EventEmitter from "../../events";

export const ERROR_BUS = new EventEmitter();

const ENUM_ERROR = [
  "Enumeration values can only contain alphanumeric characters (they can also have spaces, dashes, underscores and periods in the middle, but not more than one of these special characters in a row)."
];

function truncateErrorFieldKey(errorString) {
  let parts = errorString.split(" ");
  let keyParts = parts[0].split(".");
  parts[0] = keyParts[keyParts.length - 1];
  return parts.join(" ")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/(\[[0-9+]\])/g, "")
    .replace("Versions{Android}", "version") // schema IEE strangeness
    .replace("Versions{i Phone OS}", "version") // schema IEE strangeness
    .toLowerCase();
}

function fixEnumErrorsForTopLevelEditor(errors) {
  let adjErrorFields = [];
  for (let prop in errors) {
    if (prop.indexOf(".enumeration[") > -1) {
      let adjProp = prop.split(".enumeration[")[0] + ".enumeration";
      adjErrorFields.push(adjProp);
      delete errors[prop];
    }
  }
  // Duplicates are eliminated in this copy back using field names as prop names.
  adjErrorFields.forEach(function(newProp) {
    errors[newProp] = ENUM_ERROR;
  });
}

function errorFieldKeyToId(errorKey) {
  return errorKey.replace(/[\s{\[\]]/g, "")
    .replace(/\./g, "_")
    .replace(/}/g, "");
}

export default class Errors {
  constructor() {
    this.container = null;
    this.filterId = null;
    this.errorsObs = ko.observableArray([]);
    this.displayObs = ko.computed(() => this.errorsObs().length > 0);
    this.errorQueue = [];
    this.errorLabelQueue = [];
    this.domObs = ko.observable();
    this.domObs.subscribe((el) => {
      this.filterId = el.parentNode.getAttribute('id');
      this.container = el.closest('.content') || el.closest('.scrollbox');
    });
    ERROR_BUS.addEventListener('clearErrors', this.clearErrors.bind(this));
    ERROR_BUS.addEventListener('showErrors', this.showErrors.bind(this));
  }
  clearErrors() {
    this.errorsObs.removeAll();
    toastr.clear();
    this.errorQueue.forEach(field => field.classList.remove("error"));
    this.errorLabelQueue.forEach(el => el.parentNode.removeChild(el));
    this.errorQueue = [];
    this.errorLabelQueue = [];
  }
  showErrors(payload) { 
    if (payload.id !== this.filterId) {
      if (!payload.id) {
        console.error('Payload declares no error component target ID');
      }
      return;
    }
    let errors = payload.errors || {};
    fixEnumErrorsForTopLevelEditor(errors);

    let globalErrors = [];
    if (Object.keys(errors).length === 0) {
      globalErrors.push(payload.message);
    }
    for (let fieldName in errors) {
      let string = errors[fieldName].map(truncateErrorFieldKey).join("; ");
      let id = errorFieldKeyToId(fieldName);
      let fieldEl = this.container.querySelector(`#${id}`) || this.container.querySelector(`.${id}`);
      if (fieldEl) {
        this.renderFieldError(fieldEl, string);
      } else {
        globalErrors.push(string);
      }
    }
    if (globalErrors.length === 0) {
      globalErrors.push("Please see the errors in red below");
    }
    this.errorsObs.pushAll(globalErrors);
  }
  renderFieldError(fieldEl, string) { 
    let containerDiv = fieldEl.querySelector(".error.box");
    if (!containerDiv) {
      containerDiv = document.createElement("div");
      containerDiv.className = "error box";
    }
    containerDiv.innerHTML = "";
    let error = document.createElement("div");
    error.className = "ui basic red pointing prompt label transition visible";
    error.innerHTML = string;
    containerDiv.appendChild(error);

    this.errorLabelQueue.push(containerDiv);
    fieldEl.appendChild(containerDiv);
    fieldEl.classList.add("error");
    this.errorQueue.push(fieldEl);
  }
}
