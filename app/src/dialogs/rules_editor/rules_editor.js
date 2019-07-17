import fn from "../../functions";
import ko from "knockout";
import root from "../../root";
import serverService from "../../services/server_service";

const ACTION_OPTIONS = Object.freeze([
  { value: "skipTo", label: "skip to question" },
  { value: "endSurvey", label: "end the survey" },
  { value: "assignDataGroup", label: "assign data group" },
  { value: "displayIf", label: "then display" },
  { value: "displayUnless", label: "then do not display" }
]);
const SET_OPS = ["any", "all"];
const NO_VALUE_OPS = ["de", "always"];

/**
 * Create a rule object with new observables.
 * @param rule
 * @returns {{operator: *, value: *, skipTo: *}}
 */
function createRule(rule) {
  // This copy into new observables allows you to close the dialog without altering the
  // underlying survey. Knockout also does not do well with a boolean value, so we have
  // to convert that to a string, and convert it back again when closing the dialog.
  let action = "skipTo";
  if (rule.assignDataGroup) {
    action = "assignDataGroup";
  } else if (rule.endSurvey) {
    action = "endSurvey";
  } else if (rule.displayIf) {
    action = "displayIf";
  } else if (rule.displayUnless) {
    action = "displayUnless";
  }
  return {
    operatorObs: ko.observable(rule.operator),
    valueObs: ko.observable(rule.value),
    assignDataGroupObs: ko.observable(rule.assignDataGroup),
    skipToObs: ko.observable(rule.skipTo),
    dataGroupsObs: ko.observableArray(rule.dataGroups),
    actionSelectedObs: ko.observable(action)
  };
}

function filterOutRulesWithNoValues(rule) {
  let op = rule.operatorObs();
  if (SET_OPS.includes(op)) {
    rule.valueObs(null);
  } else if (NO_VALUE_OPS.includes(op)) {
    rule.dataGroupsObs([]);
  }
  return rule.valueObs() || rule.dataGroupsObs().length || NO_VALUE_OPS.includes(op);
}

function observerToObject(rule) {
  let obj = { operator: rule.operatorObs() };
  if (!SET_OPS.includes(rule.operatorObs())) {
    obj.value = rule.valueObs();
  } else {
    obj.dataGroups = rule.dataGroupsObs();
  }
  if (rule.actionSelectedObs() === "skipTo") {
    obj.skipTo = rule.skipToObs();
  } else if (rule.actionSelectedObs() === "assignDataGroup") {
    obj.assignDataGroup = rule.assignDataGroupObs();
  } else if (rule.actionSelectedObs() === "endSurvey") {
    obj.endSurvey = true;
  } else if (rule.actionSelectedObs() === "displayIf") {
    obj.displayIf = true;
  } else if (rule.actionSelectedObs() === "displayUnless") {
    obj.displayUnless = true;
  }
  return obj;
}

/**
 * Create options for all elements after the current element in the survey, that have
 * identifiers (new elements will not until the user adds the field).
 * @param elementsArray
 * @param startIdentifier
 * @returns {*|Array}
 */
function getIdentifierOptions(elementsArray, startIdentifier) {
  let startIdentifierFound = false;
  return elementsArray
    .filter(function(el) {
      let valid = !!el.identifierObs() && startIdentifierFound;
      if (el.identifierObs() === startIdentifier) {
        startIdentifierFound = true;
      }
      return valid;
    })
    .map(function(el) {
      return { value: el.identifierObs(), label: el.identifierObs() };
    });
}

/**
 * Receives:
 *      ViewModel parentViewModel
 *      Element element
 *      fieldName property of the rules (afterRules, beforeRules)
 * @param params
 */
export default function(params) {
  let self = this;
  let parent = params.parentViewModel;

  fn.copyProps(self, parent, "elementsObs", "operatorOptions", "operatorLabel");
  fn.copyProps(self, params, "element", "fieldName");
  self.selectedIndexObs = ko.observable();
  self.rulesObs = ko.observableArray([]);

  self.identifierOptions = getIdentifierOptions(self.elementsObs(), self.element.identifier);
  self.cancelRules = root.closeDialog;
  self.actionOptions = ACTION_OPTIONS;
  self.dataGroupOptionsObs = ko.observableArray([]);
  self.dataGroupStringOptionsObs = ko.observableArray([]);

  self.addRule = function() {
    let id = self.identifierOptions.length ? self.identifierOptions[0].value : "";
    self.rulesObs.push(createRule({ operator: "eq", value: "", skipTo: id }));
  };
  self.deleteRule = function(rule) {
    self.rulesObs.remove(rule);
  };
  self.saveRules = function() {
    let rules = self
      .rulesObs()
      .filter(filterOutRulesWithNoValues)
      .map(observerToObject);
    self.element[self.fieldName](rules);
    root.closeDialog();
  };

  serverService.getStudy().then(function(study) {
    let dataGroups = study.dataGroups.map(function(group) {
      return { value: group, label: group };
    });
    self.dataGroupOptionsObs(dataGroups);
    self.dataGroupStringOptionsObs([].concat(study.dataGroups));

    let obs = params.element[params.fieldName]().map(createRule);
    self.rulesObs(obs);
  });
};
