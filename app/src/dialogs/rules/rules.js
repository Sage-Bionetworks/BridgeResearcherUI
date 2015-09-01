var ko = require('knockout');
var utils = require('../../utils');

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

function getIdentifiers(elementsArray) {
    // The filter removes new elements that don't yet have an identifier.
    return elementsArray.filter(function(el) {
        return !!el.identifierObs();
    }).map(function(el) {
        return {value: el.identifierObs(), label: el.identifierObs()};
    });
}

/**
 * Receives:
 *      ViewModel parentViewModel
 *      Element element
 *      Observer publishedObs
 * @param params
 */
module.exports = function(params) {
    var self = this;
    var parent = params.parentViewModel;
    self.element = parent.element;
    self.elementsObs = parent.elementsObs;
    self.publishedObs = parent.publishedObs;

    var con = params.element.constraints;
    self.rulesObs = ko.observableArray(con.rulesObs().map(createRule));

    self.identifierOptions = getIdentifiers(self.elementsObs());
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
        utils.closeDialog();
    };
    self.cancelRules = function() {
        utils.closeDialog();
    };
};