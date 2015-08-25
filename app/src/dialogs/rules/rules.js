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
    {value: 'de', label: 'declined'}
];

module.exports = function(params) {
    var self = this;

    var parent = params.parentViewModel;
    self.surveyObs = parent.surveyObs;
    self.element = parent.element;
    self.publishedObs = parent.publishedObs;

    self.rulesObs = params.rulesObs;
    var rulesCopy = self.rulesObs();
    self.rulesObs(self.rulesObs().map(function(rule) {
        return mapping.fromJS(rule);
    }));

    var identifierOptions = self.surveyObs().elements.map(function(el) {
        return {value: el.identifier, label: el.identifier};
    });

    self.getOperators = function() {
        return opOptions;
    };
    self.operatorLabel = function(token) {
        var options = opOptions.filter(function(option) {
            return option.value === token;
        });
        return (options.length) ? options[0].label: '';
    };
    self.getIdentifiers = function() {
        return identifierOptions;
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
        utils.closeDialog();
    };
    /*
    self.cancel = function() {
        self.rulesObs(rulesCopy);
        utils.closeDialog();
    };*/
    self.cancelRules = function() {
        self.rulesObs(rulesCopy);
        utils.closeDialog();
    };
};