var ko = require('knockout');
var utils = require('../../utils');
var root = require('../../root');

/**
 * Create a rule object with new observables.
 * @param rule
 * @returns {{operator: *, value: *, skipTo: *}}
 */
function createRule(rule) {
    return {
        operator: ko.observable(ko.unwrap(rule.operator)),
        value: ko.observable(ko.unwrap(rule.value)),
        skipTo: ko.observable(ko.unwrap(rule.skipTo))
    };
}
/**
 * Filter out a rule if it is not a declined rule, and has no value.
 * @param rule
 * @returns {boolean|*}
 */
function filterOutRulesWithNoValues(rule) {
    if (rule.operator() === 'de') {
        rule.value(null);
    }
    return (rule.operator() === 'de' || rule.value());
}

/**
 * Create options for all elements after the current element in the survey, that have
 * identifiers (new elements will not until the user adds the field).
 * @param elementsArray
 * @param startIdentifier
 * @returns {*|Array}
 */
function getIdentifierOptions(elementsArray, startIdentifier) {
    var startIdentifierFound = false;
    return elementsArray.filter(function(el) {
        var valid = !!el.identifierObs() && startIdentifierFound;
        if (el.identifierObs() === startIdentifier) {
            startIdentifierFound = true;
        }
        return valid;
    }).map(function(el) {
        return {value: el.identifierObs(), label: el.identifierObs()};
    });
}

/**
 * Receives:
 *      ViewModel parentViewModel
 *      Element element
 * @param params
 */
module.exports = function(params) {
    var self = this;
    var parent = params.parentViewModel;
    self.element = parent.element;
    self.elementsObs = parent.elementsObs;

    var con = params.element.constraints;
    self.rulesObs = ko.observableArray(con.rulesObs().map(createRule));

    self.identifierOptions = getIdentifierOptions(self.elementsObs(), self.element.identifier);
    self.identifierLabel = utils.identity;
    self.operatorOptions = parent.operatorOptions;
    self.operatorLabel = parent.operatorLabel;

    self.addRule = function() {
        var id = (self.identifierOptions.length) ? self.identifierOptions[0].value : "";
        self.rulesObs.push(createRule({operator: "eq", value: "", skipTo: id}));
    };
    self.deleteRule = function(rule, event) {
        event.preventDefault();
        event.stopPropagation();
        self.rulesObs.remove(rule);
    };
    self.saveRules = function() {
        var rules = self.rulesObs().filter(filterOutRulesWithNoValues);
        self.element.constraints.rulesObs(rules);
        root.closeDialog();
    };
    self.cancelRules = function() {
        root.closeDialog();
    };
};