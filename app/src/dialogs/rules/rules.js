var ko = require('knockout');
var utils = require('../../utils');
var mapping = require('knockout-mapping');

var opOptions = [
    {value: 'eq', label: '='},
    {value: 'ne', label: '!='},
    {value: 'lt', label: '<'},
    {value: 'gt', label: '>'},
    {value: 'le', label: '<='},
    {value: 'ge', label: '>='},
    {value: 'de', label: 'declined'},
];

module.exports = function(params) {
    var self = this;
    var parent = params.parentViewModel;
    self.surveyObs = parent.surveyObs;
    self.element = parent.element;
    self.publishedObs = parent.publishedObs;

    var rules = (parent.element.constraints.rules || []).map(mapping.fromJS);
    self.rulesObs = ko.observableArray(rules);

    var identifierOptions = self.surveyObs().elements.map(function(el) {
        return {value: el.identifier, label: el.identifier};
    });

    self.cancel = function() {
        utils.closeDialog();
    };
    self.getOperators = function() {
        return opOptions;
    };
    self.operatorLabel = function(token) {
        var options = opOptions.filter(function(option) {
            return option.value === token;
        });
        return (options.length) ? options[0].label: '';
    };
    self.identifierLabel = function(token) {
        return token;
    };
    self.getIdentifiers = function() {
        return identifierOptions;
    };

    self.addRule = function() {
        self.rulesObs.push({
            operator: ko.observable("eq"),
            value: ko.observable(""),
            skipTo: ko.observable(identifierOptions[0].value)
        });
    };
    self.deleteRule = function(rule) {
        self.rulesObs.remove(rule);
    };
    self.saveRules = function() {
        // So, yay. we did it, but nothing updates in the UI
        self.element.constraints.rules = self.rulesObs().map(mapping.toJS).filter(function(rule) {
            return !!rule.value;
        });
        utils.closeDialog();
    };
    self.cancelRules = function() {
        utils.closeDialog();
    };
};