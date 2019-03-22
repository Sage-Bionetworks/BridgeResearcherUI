import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import utils from "../../utils";

const UNIT_OPTIONS = Object.freeze([
  { value: null, label: "<none>" },
  { value: "seconds", label: "Seconds" },
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
  { value: "centimeters", label: "Centimeters" },
  { value: "cubic_centimeters", label: "Cubic Centimeters" },
  { value: "cubic_meters", label: "Cubic Meters" },
  { value: "feet", label: "Feet" },
  { value: "gallons", label: "Gallons" },
  { value: "grams", label: "Grams" },
  { value: "inches", label: "Inches" },
  { value: "kilograms", label: "Kilograms" },
  { value: "kilometers", label: "Kilometers" },
  { value: "liters", label: "Liters" },
  { value: "meters", label: "Meters" },
  { value: "miles", label: "Miles" },
  { value: "milliliters", label: "Millileters" },
  { value: "ounces", label: "Ounces" },
  { value: "pints", label: "Pints" },
  { value: "pounds", label: "Pounds" },
  { value: "quarts", label: "Quarts" },
  { value: "yards", label: "Yards" }
]);
const DURATION_OPTIONS = Object.freeze([
  { value: null, label: "<none>" },
  { value: "seconds", label: "Seconds" },
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" }
]);
const OPERATOR_OPTIONS = Object.freeze([
  { value: "eq", label: "When value =" },
  { value: "ne", label: "When value !=" },
  { value: "lt", label: "When value <" },
  { value: "gt", label: "When value >" },
  { value: "le", label: "When value <=" },
  { value: "ge", label: "When value >=" },
  { value: "de", label: "When question is declined" },
  { value: "always", label: "Always" },
  { value: "any", label: "If user has any groups" },
  { value: "all", label: "If user has all groups" }
]);
const uiHintLabels = Object.freeze({
  checkbox: "Checkbox",
  combobox: "Combobox",
  datepicker: "Date Picker",
  datetimepicker: "Date & Time Picker",
  yearmonth: "Month & Year Picker",
  list: "List",
  multilinetext: "Multiline Text Field",
  numberfield: "Number Field",
  radiobutton: "Radio Button",
  select: "Select Control",
  slider: "Slider",
  textfield: "Text Field",
  timepicker: "Time Picker",
  toggle: "Toggle Button",
  weight: "Weight",
  height: "Height",
  bloodpressure: "Blood Pressure",
  postalcode: "Postal Code"
});
const UI_HINT_OPTIONS = Object.freeze(
  Object.keys(uiHintLabels).reduce(function(object, key) {
    object[key] = { value: key, label: uiHintLabels[key] };
    return object;
  }, {})
);

const SELECT_OPTIONS_BY_TYPE = Object.freeze({
  BooleanConstraints: [UI_HINT_OPTIONS.checkbox, UI_HINT_OPTIONS.toggle],
  DateConstraints: [UI_HINT_OPTIONS.datepicker],
  DateTimeConstraints: [UI_HINT_OPTIONS.datetimepicker],
  YearMonthConstraints: [UI_HINT_OPTIONS.yearmonth],
  DecimalConstraints: [UI_HINT_OPTIONS.numberfield, UI_HINT_OPTIONS.slider, UI_HINT_OPTIONS.select],
  DurationConstraints: [UI_HINT_OPTIONS.numberfield, UI_HINT_OPTIONS.slider, UI_HINT_OPTIONS.select],
  MultiValueConstraints: [
    UI_HINT_OPTIONS.checkbox,
    UI_HINT_OPTIONS.combobox,
    UI_HINT_OPTIONS.list,
    UI_HINT_OPTIONS.radiobutton,
    UI_HINT_OPTIONS.select,
    UI_HINT_OPTIONS.slider
  ],
  IntegerConstraints: [UI_HINT_OPTIONS.numberfield, UI_HINT_OPTIONS.slider, UI_HINT_OPTIONS.select],
  StringConstraints: [UI_HINT_OPTIONS.multilinetext, UI_HINT_OPTIONS.textfield],
  TimeConstraints: [UI_HINT_OPTIONS.timepicker],
  BloodPressureConstraints: [UI_HINT_OPTIONS.bloodpressure],
  HeightConstraints: [UI_HINT_OPTIONS.height],
  WeightConstraints: [UI_HINT_OPTIONS.weight],
  PostalCodeConstraints: [UI_HINT_OPTIONS.postalcode]
});
const ELEMENT_TEMPLATE = Object.freeze({
  SurveyInfoScreen: {
    type: "SurveyInfoScreen",
    title: "",
    prompt: "",
    promptDetail: "",
    identifier: "",
    beforeRules: [],
    afterRules: []
  },
  SurveyQuestion: {
    type: "SurveyQuestion",
    fireEvent: false,
    uiHint: "",
    prompt: "",
    promptDetail: "",
    identifier: "",
    beforeRules: [],
    afterRules: []
  }
});
const DATA_TYPE_OPTIONS = Object.freeze([
  { label: "String", value: "string" },
  { label: "Boolean", value: "boolean" },
  { label: "Date", value: "date" },
  { label: "Date & Time", value: "datetime" },
  { label: "Duration", value: "duration" },
  { label: "Time", value: "time" },
  { label: "Integer", value: "integer" },
  { label: "Decimal", value: "decimal" },
  { label: "Blood Pressure", value: "bloodpressure" },
  { label: "Height", value: "height" },
  { label: "Weight", value: "weight" },
  { label: "Month & Year", value: "yearmonth" },
  { label: "Postal Code", value: "postalcode" }
]);
const CONSTRAINTS_TEMPLATES = Object.freeze({
  BooleanConstraints: { dataType: "boolean" },
  DateConstraints: { dataType: "date", allowFuture: false, earliestValue: "", latestValue: "" },
  DateTimeConstraints: { dataType: "datetime", allowFuture: false, earliestValue: "", latestValue: "" },
  YearMonthConstraints: { dataType: "yearmonth", allowFuture: false, earliestValue: "", latestValue: "" },
  TimeConstraints: { dataType: "time" },
  IntegerConstraints: { dataType: "integer", minValue: 0, maxValue: 255, unit: "", step: 1.0 },
  DecimalConstraints: { dataType: "decimal", minValue: 0, maxValue: 255, unit: "", step: 1.0 },
  DurationConstraints: { dataType: "duration", minValue: 0, maxValue: 255, unit: "", step: 1.0 },
  StringConstraints: {
    dataType: "string",
    minLength: 0,
    maxLength: 255,
    pattern: "",
    patternPlaceholder: "",
    patternErrorMessage: ""
  },
  MultiValueConstraints: { dataType: "string", enumeration: [], allowOther: false, allowMultiple: false },
  BloodPressureConstraints: { dataType: "bloodpressure" },
  HeightConstraints: { dataType: "height", forInfant: false },
  WeightConstraints: { dataType: "weight", forInfant: false },
  PostalCodeConstraints: { dataType: "postalcode", countryCode: "us" }
});
const UI_HINT_FOR_CONSTRAINTS = Object.freeze({
  BooleanConstraints: "checkbox",
  DateConstraints: "datepicker",
  DateTimeConstraints: "datetimepicker",
  YearMonthConstraints: "yearmonth",
  TimeConstraints: "timepicker",
  IntegerConstraints: "numberfield",
  DecimalConstraints: "numberfield",
  DurationConstrains: "numberfield",
  StringConstraints: "textfield",
  MultiValueConstraints: "list",
  BloodPressureConstraints: "bloodpressure",
  HeightConstraints: "height",
  WeightConstraints: "weight",
  PostalCodeConstraints: "postalcode"
});

const SURVEY_FIELDS = ["name", "createdOn", "guid", "identifier", "published", "version", "copyrightNotice"];
const ELEMENT_FIELDS = [
  "prompt",
  "promptDetail",
  "title",
  "uiHint",
  "identifier",
  "fireEvent",
  "beforeRules",
  "afterRules"
];

function getConstraints(type) {
  let con = { type: type };
  ko.utils.extend(con, CONSTRAINTS_TEMPLATES[type]);
  return con;
}

function makeObservable(obj, field) {
  // Note we're copying the array when passing it to the observable, or it gets shared between properties,
  // enumeration in particular (rules is remodeled)
  if (["rules", "beforeRules", "afterRules", "enumeration"].indexOf(field) > -1) {
    let array = obj[field] ? [].concat(obj[field]) : [];
    return ko.observableArray(array);
  } else {
    return ko.observable(obj[field]);
  }
}

/**
 * Create an observable for all the mutable fields on an element.
 * @param element
 * @returns {*}
 */
function elementToObservables(element) {
  ELEMENT_FIELDS.forEach(function(field) {
    element[field + "Obs"] = makeObservable(element, field);
  });
  let con = element.constraints;
  if (con) {
    // We do this twice for new objects... that's okay and it's necessary for correct initialization
    Object.keys(getConstraints(con.type)).forEach(function(field) {
      con[field + "Obs"] = makeObservable(con, field);
    });
    element.constraintsTypeObs = ko.observable(con.type);
  }
  element.changeUiHint = function(domEl) {
    let newHint = domEl.getAttribute("data-type");
    element.uiHintObs(newHint);
  };
  return element;
}
/**
 * Copy observer values back to original element, ignoring any observables
 * that were not used (that have undefined values).
 * @param element
 * @returns {*}
 */
function observablesToElement(element) {
  let con = element.constraints;
  if (con && con.typeObs() === "MultiValueConstraints" && con.allowMultipleObs()) {
    element.uiHintObs(UI_HINT_OPTIONS.checkbox.value);
  }
  ELEMENT_FIELDS.forEach(function(field) {
    updateModelField(element, field);
  });
  if (con) {
    Object.keys(getConstraints(con.type)).forEach(function(field) {
      updateModelField(con, field);
    });
  }
  return element;
}
/**
 * Copy observer value back to original model field. This ignores any observable
 * that was unused (ie. has an undefined value).
 * @param model
 * @param fieldName
 */
function updateModelField(model, fieldName) {
  let obsName = fieldName + "Obs";

  if (typeof model[obsName]() !== "undefined") {
    if (model.dataType === "date" && model[obsName]() instanceof Date) {
      model[fieldName] = model[obsName]()
        .toISOString()
        .split("T")[0];
    } else {
      model[fieldName] = model[obsName]();
    }
    if (model[fieldName] === "") {
      delete model[fieldName];
    }
  }
}
function newSurvey() {
  return { name: "", guid: "", identifier: "", published: false, createdOn: null, elements: [], version: null };
}
function newField(type) {
  let elementType = type === "SurveyInfoScreen" ? type : "SurveyQuestion";
  let newEl = { type: elementType };
  ko.utils.extend(newEl, ELEMENT_TEMPLATE[elementType]);
  if (elementType === "SurveyQuestion") {
    newEl.uiHint = UI_HINT_FOR_CONSTRAINTS[type];
    newEl.constraints = getConstraints(type);
  }
  return elementToObservables(newEl);
}
function changeElementType(oldElement, newType) {
  let newElement = newField(newType);
  newElement = elementToObservables(newElement);
  ELEMENT_FIELDS.forEach(function(field) {
    newElement[field + "Obs"](oldElement[field + "Obs"]());
  });
  // except for UI hint which is bound to constraints, but not in constraints...
  newElement.uiHintObs(newElement.uiHint);

  let bothQuestions = oldElement.type !== "SurveyInfoScreen" && newElement.type !== "SurveyInfoScreen";
  if (bothQuestions) {
    // Because they are not going to be swapped out...
    oldElement.uiHint = newElement.uiHint;
    oldElement.uiHintObs(newElement.uiHintObs());
    oldElement.constraints = newElement.constraints;
    oldElement.constraintsTypeObs(newType);
  }
  return newElement;
}

export default {
  newSurvey,
  newField,
  observablesToElement,
  elementToObservables,
  changeElementType,
  surveyToObservables: function(vm, survey) {
    SURVEY_FIELDS.forEach(function(field) {
      vm[field + "Obs"](survey[field]);
    });
    let elements = survey.elements.map(elementToObservables);
    vm.elementsObs.pushAll(elements);
  },
  observablesToSurvey: function(vm, survey) {
    SURVEY_FIELDS.forEach(function(field) {
      survey[field] = vm[field + "Obs"]();
    });
    survey.elements = vm.elementsObs().map(observablesToElement);
  },
  /**
   * Initialize all the observables of the entire tree that are needed for all
   * the editors, in one pass.
   * @param vm
   * @param params
   */
  initSurveyVM: function(vm) {
    vm.selectedElementObs = ko.observable(0);
    SURVEY_FIELDS.forEach(function(field) {
      vm[field + "Obs"] = ko.observable("");
    });
    vm.elementsObs = ko.observableArray([]);
    vm.titleObs = ko.computed(function() {
      return vm.nameObs() ? vm.nameObs() : "New Survey";
    });
  },
  /**
   * Constraints have a *lot* of common elements, initialize them all here. This is basically a mixin where there's
   * no pattern for mixins per se in knockout.js.
   * @param vm
   * @param params
   */
  initConstraintsVM: function(vm, params) {
    vm.element = params.element;
    vm.elementsObs = params.elementsObs;
    vm.beforeRulesObs = params.element.beforeRulesObs;
    vm.afterRulesObs = params.element.afterRulesObs;
    vm.formatDate = fn.formatDate;
    vm.formatDateTime = fn.formatDateTime;
    vm.operatorOptions = OPERATOR_OPTIONS;
    vm.collectionName = params.collectionName;
    vm.operatorLabel = utils.makeOptionLabelFinder(OPERATOR_OPTIONS);
    vm.hasRules = function(fieldName) {
      return vm[fieldName]() !== null && vm[fieldName]().length > 0;
    };
    vm.editRules = function(fieldName) {
      return function() {
        root.openDialog("rules_editor", {
          parentViewModel: vm,
          element: vm.element,
          fieldName: fieldName
        });
      };
    };
    vm.formatRule = function(rule) {
      let array = [];
      array.push(vm.operatorLabel(rule.operator));
      if (rule.operator !== "de" && rule.operator !== "always") {
        array.push(rule.value);
      }
      if (rule.dataGroups && rule.dataGroups.length) {
        array.push(
          rule.dataGroups
            .map(function(group) {
              return "&ldquo;" + group + "&rdquo;";
            })
            .join(", ")
        );
      }
      if (rule.endSurvey) {
        array.push("end the survey");
      } else if (rule.skipTo) {
        array.push("skip to &ldquo;" + rule.skipTo + "&rdquo;");
      } else if (rule.assignDataGroup) {
        array.push("add data group &ldquo;" + rule.assignDataGroup + "&rdquo;");
      } else if (rule.displayIf) {
        array.push("then display screen");
      } else if (rule.displayUnless) {
        array.push("then do not display screen");
      }
      return array.join(" ");
    };

    if (params.element.type === "SurveyQuestion") {
      vm.getUiHintOptions = function(dataType) {
        return SELECT_OPTIONS_BY_TYPE[vm.element.constraints.type];
      };
      vm.durationOptions = DURATION_OPTIONS;
      vm.durationLabel = utils.makeOptionLabelFinder(DURATION_OPTIONS);
      vm.uiHintObs = params.element.uiHintObs;
      vm.fireEventObs = params.element.fireEventObs;
      vm.uiHintOptions = SELECT_OPTIONS_BY_TYPE[params.element.constraints.type];
      vm.uiHintLabel = utils.makeOptionLabelFinder(vm.uiHintOptions);
      vm.dataTypeOptions = DATA_TYPE_OPTIONS;
      vm.dataTypeLabel = utils.makeOptionLabelFinder(vm.dataTypeOptions);
      vm.unitOptions = UNIT_OPTIONS;
      vm.unitLabel = utils.makeOptionLabelFinder(UNIT_OPTIONS);
    }
  }
};
