var ko = require('knockout');
var root = require('../../root');
var fn = require('../../functions');
var serverService = require('../../services/server_service');

var ACTION_OPTIONS = Object.freeze([
    {value: 'skipTo', label: 'skip to question'},
    {value: 'endSurvey', label: 'end the survey'},
    {value: 'assignDataGroup', label: 'assign data group'}
]);

/**
 * Create a rule object with new observables.
 * @param rule
 * @returns {{operator: *, value: *, skipTo: *}}
 */
function createRule(rule) {
    // This copy into new observables allows you to close the dialog without altering the 
    // underlying survey. Knockout also does not do well with a boolean value, so we have 
    // to convert that to a string, and convert it back again when closing the dialog.

    var action = (rule.assignDataGroup) ? 'assignDataGroup' : (rule.skipTo) ? 'skipTo' : 'endSurvey';
    return {
        operator: ko.observable(ko.unwrap(rule.operator)),
        value: ko.observable(ko.unwrap(rule.value)),
        assignDataGroup: ko.observable(ko.unwrap(rule.assignDataGroup)),
        skipTo: ko.observable(ko.unwrap(rule.skipTo)),
        actionSelectedObs: ko.observable(action)
    };
}
/**
 * Filter out a rule if it is not a declined rule, and has no value.
 * @param rule
 * @returns {boolean|*}
 */
function filterOutRulesWithNoValues(rule) {
    if (rule.operator() === 'de' || rule.operator() === 'always') {
        rule.value(null);
    }
    return (rule.operator() === 'de' || rule.operator() === 'always' || rule.value());
}

function observerToObject(rule) {
    var obj = {operator: rule.operator(), value: rule.value()};
    if (rule.actionSelectedObs() === "skipTo") {
        obj.skipTo = rule.skipTo();
    } else if (rule.actionSelectedObs() === "endSurvey") {
        obj.endSurvey = true;
    } else if (rule.actionSelectedObs() === "assignDataGroup") {
        obj.assignDataGroup = rule.assignDataGroup();
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

    fn.copyProps(self, parent, 'element', 'elementsObs', 'operatorOptions', 'operatorLabel');
    self.selectedIndexObs = ko.observable();
    self.rulesObs = ko.observableArray(params.element.rulesObs().map(createRule));
    self.identifierOptions = getIdentifierOptions(self.elementsObs(), self.element.identifier);
    self.identifierLabel = fn.identity;
    self.cancelRules = root.closeDialog;
    self.actionOptions = ACTION_OPTIONS;
    self.dataGroupOptions = ko.observableArray([]);

    self.addRule = function() {
        var id = (self.identifierOptions.length) ? self.identifierOptions[0].value : "";
        self.rulesObs.push(createRule({operator: "eq", value: "", skipTo: id, endSurvey: false}));
    };
    self.deleteRule = function(rule) {
        self.rulesObs.remove(rule);
    };
    self.saveRules = function() {
        var rules = self.rulesObs().filter(filterOutRulesWithNoValues).map(observerToObject);
        self.element.rulesObs(rules);
        root.closeDialog();
    };

    serverService.getStudy().then(function(study) {
        var dataGroups = study.dataGroups.map(function(group) {
            return {value: group, label: group};
        });
        self.dataGroupOptions(dataGroups);
    });
};