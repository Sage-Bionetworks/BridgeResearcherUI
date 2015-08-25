var utils = require('../../utils');
var ko = require('knockout');

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
module.exports = {
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
            vm.hasRules = function() {
                return (vm.rulesObs() != null && vm.rulesObs().length > 0);
            };
            vm.surveyObs = params.surveyObs;

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
            vm.editEnum = function() {
                utils.openDialog('enumeration', {parentViewModel: vm});
            };
            vm.editRules = function() {
                utils.openDialog('rules', {parentViewModel: vm, rulesObs: vm.rulesObs});
            };
        } else {
            console.log("Skipped element because it wasn't a question", params.element);
        }
    }
};