import "knockout-postbox";
import $ from "jquery";
import ko from "knockout";
import toastr from "toastr";

const ENUM_ERROR = [
  "Enumeration values can only contain alphanumeric characters (they can also have spaces, dashes, underscores and periods in the middle, but not more than one of these special characters in a row)."
];

function truncateErrorFieldKey(errorString) {
  let parts = errorString.split(" ");
  let keyParts = parts[0].split(".");
  parts[0] = keyParts[keyParts.length - 1];
  return parts
    .join(" ")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/(\[[0-9+]\])/g, "")
    .replace("Versions{Android}", "version") // schema IEE strangeness
    .replace("Versions{i Phone OS}", "version") // schema IEE strangeness
    .toLowerCase();
}

/**
 * The survey editor creates detailed error messages for enumeration values that we can't display in the
 * editor. Collapse and simplify these messages so we can point to the right questions.
 */
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
  return errorKey
    .replace(/[\s{\[\]]/g, "")
    .replace(/\./g, "_")
    .replace(/}/g, "");
}

export default function errors() {
  let self = this;
  self.domObs = ko.observable();

  let errorQueue = [];
  let errorLabelQueue = [];

  self.errorsObs = ko.observableArray([]);
  self.displayObs = ko.computed(function() {
    return self.errorsObs().length > 0;
  });

  ko.postbox.subscribe("showErrors", function(payload) {
    let message = payload.message;
    let errors = payload.errors || {};
    fixEnumErrorsForTopLevelEditor(errors);

    // Scroll to top of scrollbox. jQuery is included globally in the page
    let container = self.domObs().closest(".scrollbox");
    if (container) {
      container.scrollTo(0, 0);
    } else {
      container = self.domObs().closest(".content");
    }

    let globalErrors = [];
    // This was basically a payload with a message and no errors... so show the message.
    if (Object.keys(errors).length === 0) {
      globalErrors.push(message);
    }
    for (let fieldName in errors) {
      let string = errors[fieldName].map(truncateErrorFieldKey).join("; ");

      // This now attempts to find a class token because the range controls have one field
      // border and two controls, both of which can have server errors. Were I to redo this,
      // I might be inclined to switch over entirely to class tokens rather than IDs to
      // simplify this, but it introduces new difficulties.
      let id = errorFieldKeyToId(fieldName);
      let fieldEl = container.querySelector('#'+id);
      if (!fieldEl) {
        // When you search by class, 1) there can be more than one, 2) some can be hidden. Filter
        // out the hidden ones and take the LAST one that is not hidden.
        let elements = Array.from(container.querySelectorAll("." + id)).filter(el => el.offsetParent !== null);
        fieldEl = (elements.length) ? elements[elements.length-1] : null;
      }
      if (fieldEl) {
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

        errorLabelQueue.push(containerDiv);
        fieldEl.appendChild(containerDiv);
        fieldEl.classList.add("error");
        errorQueue.push(fieldEl);
      } else {
        globalErrors.push(string);
      }
    }
    if (globalErrors.length === 0) {
      globalErrors.push("Please see the errors in red below");
    }
    self.errorsObs.pushAll(globalErrors);
  });
  ko.postbox.subscribe("clearErrors", function() {
    self.errorsObs.removeAll();
    toastr.clear();
    errorQueue.forEach(function(field) {
      field.classList.remove("error");
    });
    errorLabelQueue.forEach(function(element) {
      element.parentNode.removeChild(element);
    });
    errorQueue = [];
    errorLabelQueue = [];
  });
};
errors.prototype.dispose = function() {
  this.displayObs.dispose();
};
