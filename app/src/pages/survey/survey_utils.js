var utils = require('../../utils');
var ko = require('knockout');
var mapping = require('knockout-mapping');

var uiHintLabels = {
    'checkbox':'Checkbox',
    'combobox':'Combobox',
    'datepicker':'Date Picker',
    'datetimepicker':'Date & Time Picker',
    'list':'List',
    'multilinetext':'Multiline Text',
    'numberfield':'Number Field',
    'radiobutton':'Radio Button',
    'select':'Select',
    'slider':'Slider',
    'textfield':'Text Field',
    'timepicker':'Time Picker',
    'toggle':'Toggle'
};
var uiHintOptions = ['checkbox', 'combobox', 'datepicker', 'datetimepicker', 'list', 'multilinetext', 'numberfield', 'radiobutton',
    'select', 'slider', 'textfield', 'timepicker', 'toggle'].reduce(function(obj, token) {
            obj[token] = {value: token, label: uiHintLabels[token]};
            return obj;
        }, {});
var selectOptionsByType = {
    'BooleanConstraints':[uiHintOptions.checkbox, uiHintOptions.toggle],
    'DateConstraints':[uiHintOptions.datepicker],
    'DateTimeConstraints':[uiHintOptions.datetimepicker],
    'DecimalConstraints':[uiHintOptions.numberfield, uiHintOptions.slider],
    'DurationConstraints':[uiHintOptions.numberfield, uiHintOptions.slider],
    'MultiValueConstraints':[uiHintOptions.checkbox, uiHintOptions.combobox, uiHintOptions.list,
        uiHintOptions.radiobutton, uiHintOptions.select, uiHintOptions.slider],
    'IntegerConstraints':[uiHintOptions.numberfield, uiHintOptions.slider],
    'DecimalConstraints':[uiHintOptions.numberfield, uiHintOptions.slider],
    'StringConstraints':[uiHintOptions.multilinetext, uiHintOptions.textfield],
    'TimeConstraints':[uiHintOptions.timepicker]
};
var unitOptions = [
    {value: 'centimeters', label: 'Centimeters'},
    {value: 'cubic_centimeters', label: 'Cubic Centimeters'},
    {value: 'cubic_meters', label: 'Cubic Meters'},
    {value: 'feet', label: 'Feet'},
    {value: 'gallons', label: 'Gallons'},
    {value: 'grams', label: 'Grams'},
    {value: 'inches', label: 'Inches'},
    {value: 'kilograms', label: 'Kilograms'},
    {value: 'kilometers', label: 'Kilometers'},
    {value: 'liters', label: 'Liters'},
    {value: 'meters', label: 'Meters'},
    {value: 'miles', label: 'Miles'},
    {value: 'milliliters', label: 'Millileters'},
    {value: 'ounces', label: 'Ounces'},
    {value: 'pints', label: 'Pints'},
    {value: 'pounds', label: 'Pounds'},
    {value: 'quarts', label: 'Quarts'},
    {value: 'yards', label: 'Yards'}
];
var durationOptions = [
    {value: 'seconds', label: 'Seconds'},
    {value: 'minutes', label: 'Minutes'},
    {value: 'hours', label: 'Hours'},
    {value: 'days', label: 'Days'},
    {value: 'weeks', label: 'Weeks'},
    {value: 'months', label: 'Months'},
    {value: 'years', label: 'Years'}
];
var opOptions = [
    {value: 'eq', label: '='},
    {value: 'ne', label: '!='},
    {value: 'lt', label: '<'},
    {value: 'gt', label: '>'},
    {value: 'le', label: '<='},
    {value: 'ge', label: '>='},
    {value: 'de', label: 'declined'}
];
var elTemplate = {
    'SurveyInfoScreen': {type: 'SurveyInfoScreen'},
    'SurveyQuestion': {fireEvent: false, type: 'SurveyQuestion'}
};
var constraintTemplates = {
    'BooleanConstraints': {dataType: "boolean", rules: [], uiHint: 'checkbox', type: 'BooleanConstraints'},
    'DateConstraints': {dataType: "date", allowFuture: false, rules: [], uiHint: 'datepicker', type: 'DateConstraints'},
    'DateTimeConstraints': {dataType: "datetime", allowFuture: false, rules: [], uiHint: 'datetimepicker', type: 'DateTimeConstraints'},
    'DurationConstraints': {dataType: "duration", rules: [], uiHint: 'numberfield', type: 'DurationConstraints'},
    'TimeConstraints': {dataType: "time", rules: [], uiHint: 'timepicker', type: 'TimeConstraints'},
    'IntegerConstraints': {dataType: "integer", rules: [], uiHint: 'numberfield', type: 'IntegerConstraints'},
    'DecimalConstraints': {dataType: "decimal", rules: [], uiHint: 'numberfield', type: 'DecimalConstraints'},
    'StringConstraints': {dataType: "string", rules: [], uiHint: 'multilinetext', type: 'StringConstraints'},
    'MultiValueConstraints': {dataType: "string", enumeration: [], rules: [], uiHint: 'checkbox', type: 'MultiValueConstraints'}
}

module.exports = {
    newElement: function(type) {
        var elementType = (type === "SurveyInfoScreen") ? type : "SurveyQuestion";

        var newEl = elTemplate[elementType];
        if (elementType === "SurveyQuestion") {
            newEl.constraints = JSON.parse(JSON.stringify(constraintTemplates[type]));
            newEl.uiHint = newEl.constraints.uiHint;
            delete newEl.constraints.uiHint;
        }
        return newEl;
    },

    /**
     * Most constraints have a lot of common elements, initialize them all here.
     * @param vm
     * @param params
     */
    initConstraintsVM: function(vm, params) {
        vm.element = params.element;
        vm.publishedObs = params.publishedObs;
        vm.formatDate = utils.formatDate;

        if (params.element.type === "SurveyQuestion") {
            vm.fireEventObs = ko.observable(params.element.fireEvent);
            vm.rulesObs = ko.observableArray(params.element.constraints.rules);
            vm.rulesObs(vm.rulesObs().map(function(rule) {
                return mapping.fromJS(rule);
            }));
            vm.hasRules = function() {
                return (vm.rulesObs() != null && vm.rulesObs().length > 0);
            };
            vm.elementsObs = params.elementsObs;

            vm.uiHintObs = ko.observable(params.element.uiHint);
            vm.uiHintLabel = function(token) {
                return uiHintLabels[token];
            };
            vm.unitLabel = function(token) {
                var options = unitOptions.filter(function(option) {
                    return option.value === token;
                });
                return (options.length) ? options[0].label: '';
            };
            vm.getUiHintOptions = function(dataType) {
                return selectOptionsByType[vm.element.constraints.type];
            };
            vm.getUnitOptions = function() {
                return unitOptions;
            };
            vm.getDurationOptions = function() {
                return durationOptions;
            };
            vm.editRules = function() {
                utils.openDialog('rules', {parentViewModel: vm, rulesObs: vm.rulesObs});
            };
            vm.getOperators = function() {
                return opOptions;
            };
            vm.operatorLabel = function(token) {
                var options = opOptions.filter(function(option) {
                    return option.value == token;
                });
                return (options.length) ? options[0].label: '';
            };
        } else {
            console.log("Skipped element because it wasn't a question", params.element);
        }
    }
};