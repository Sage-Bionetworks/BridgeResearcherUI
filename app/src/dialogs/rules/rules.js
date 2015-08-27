var ko = require('knockout');
var utils = require('../../utils');
var mapping = require('knockout-mapping');

module.exports = function(params) {
    var self = this;

    var parent = params.parentViewModel;
    self.elementsObs = parent.elementsObs;
    self.element = parent.element;
    self.publishedObs = parent.publishedObs;

    // Make a copy for editing.
    self.rulesObs = ko.observableArray(params.rulesObs().map(function(rule) {
        return ko.mapping.fromJS(ko.mapping.toJS(rule));
    }));

    // Operator label and option constructors are in survey_utils.js
    // because they are also reference by the <ui-rules/> element.
    self.getOperators = parent.getOperators;
    self.operatorLabel = parent.operatorLabel;

    var identifierOptions = self.elementsObs().filter(function(el) {
        return !!el.identifierObs();
    }).map(function(el) {
        return {value: el.identifierObs(), label: el.identifierObs()};
    });
    self.getIdentifiers = function() {
        //return identifierOptions;
        return self.elementsObs().filter(function(el) {
            return !!el.identifierObs();
        }).map(function(el) {
            return {value: el.identifierObs(), label: el.identifierObs()};
        });
    };
    self.identifierLabel = function(token) {
        return token;
    };

    self.addRule = function() {
        self.rulesObs.push({
            operator: ko.observable("eq"),
            value: ko.observable(""),
            skipTo: ko.observable(identifierOptions[0].value)
        });
    };
    self.deleteRule = function(rule, event) {
        event.preventDefault();
        event.stopPropagation();
        self.rulesObs.remove(rule);
    };
    self.saveRules = function() {
        var rules = self.rulesObs().filter(function(rule) {
            if (rule.operator() === 'de') {
                rule.value(null);
            }
            return (rule.operator() === 'de' || rule.value());
        });
        params.rulesObs(rules);
        utils.closeDialog();
    };
    self.cancelRules = function() {
        utils.closeDialog();
    };
};