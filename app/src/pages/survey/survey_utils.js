var utils = require('../../utils');
var ko = require('knockout');

var UNIT_OPTIONS = Object.freeze([
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
]);
var DURATION_OPTIONS = Object.freeze([
    {value: 'seconds', label: 'Seconds'},
    {value: 'minutes', label: 'Minutes'},
    {value: 'hours', label: 'Hours'},
    {value: 'days', label: 'Days'},
    {value: 'weeks', label: 'Weeks'},
    {value: 'months', label: 'Months'},
    {value: 'years', label: 'Years'}
]);
var OPERATOR_OPTIONS = Object.freeze([
    {value: 'eq', label: '='},
    {value: 'ne', label: '!='},
    {value: 'lt', label: '<'},
    {value: 'gt', label: '>'},
    {value: 'le', label: '<='},
    {value: 'ge', label: '>='},
    {value: 'de', label: 'declined'}
]);
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
var UI_HINT_OPTIONS = Object.freeze(Object.keys(uiHintLabels).reduce(function(object, key) {
    object[key] = {value: key, label: uiHintLabels[key]};
    return object;
}, {}));

var SELECT_OPTIONS_BY_TYPE = Object.freeze({
    'BooleanConstraints':[UI_HINT_OPTIONS.checkbox, UI_HINT_OPTIONS.toggle],
    'DateConstraints':[UI_HINT_OPTIONS.datepicker],
    'DateTimeConstraints':[UI_HINT_OPTIONS.datetimepicker],
    'DecimalConstraints':[UI_HINT_OPTIONS.numberfield, UI_HINT_OPTIONS.slider],
    'DurationConstraints':[UI_HINT_OPTIONS.numberfield, UI_HINT_OPTIONS.slider],
    'MultiValueConstraints':[UI_HINT_OPTIONS.checkbox, UI_HINT_OPTIONS.combobox, UI_HINT_OPTIONS.list,
        UI_HINT_OPTIONS.radiobutton, UI_HINT_OPTIONS.select, UI_HINT_OPTIONS.slider],
    'IntegerConstraints':[UI_HINT_OPTIONS.numberfield, UI_HINT_OPTIONS.slider],
    'DecimalConstraints':[UI_HINT_OPTIONS.numberfield, UI_HINT_OPTIONS.slider],
    'StringConstraints':[UI_HINT_OPTIONS.multilinetext, UI_HINT_OPTIONS.textfield],
    'TimeConstraints':[UI_HINT_OPTIONS.timepicker]
});
var ELEMENT_TEMPLATE = Object.freeze({
    'SurveyInfoScreen': {type:'SurveyInfoScreen', prompt:'', promptDetail:'', identifier:''},
    'SurveyQuestion': {type:'SurveyQuestion', fireEvent:false, 'uiHint':'', prompt:'', promptDetail:'', identifier:''}
});
var CONSTRAINTS_TEMPLATES = Object.freeze({
    'BooleanConstraints': {dataType:'boolean', rules:[]},
    'DateConstraints': {dataType:'date', rules:[], allowFuture:false, earliestValue:'', latestValue:'' },
    'DateTimeConstraints': {dataType:'datetime', rules:[], allowFuture:false, earliestValue:'', latestValue:'' },
    'DurationConstraints': {dataType:'duration', rules:[]},
    'TimeConstraints': {dataType:'time', rules:[]},
    'IntegerConstraints': {dataType:'integer', rules:[], minValue:0, maxValue:255, unit: '', step:1.0},
    'DecimalConstraints': {dataType:'decimal', rules: [], minValue:0, maxValue:255, unit: '', step:1.0},
    'StringConstraints': {dataType:'string', rules: [], minLength:0, maxLength:255, pattern:''},
    'MultiValueConstraints': {dataType:'string', enumeration:[], rules:[], allowOther:false, allowMultiple:false}
});
var UI_HINT_FOR_CONSTRAINTS = Object.freeze({
    'BooleanConstraints': 'radiobutton',
    'DateConstraints': 'datepicker',
    'DateTimeConstraints': 'datetimepicker',
    'DurationConstraints': 'numberfield',
    'TimeConstraints': 'timepicker',
    'IntegerConstraints': 'numberfield',
    'DecimalConstraints': 'numberfield',
    'StringConstraints': 'multilinetext',
    'MultiValueConstraints': 'checkbox'
});

var SURVEY_FIELDS = ['name','createdOn','guid','identifier','published','version'];
var ELEMENT_FIELDS = ['prompt','promptDetail','uiHint','identifier','fireEvent'];

function getConstraints(type) {
    var con = {type: type};
    ko.utils.extend(con, CONSTRAINTS_TEMPLATES[type]);
    return con;
}

function makeObservable(obj, field) {
    return (field === "rules" || field === "enumeration") ? ko.observableArray(obj[field]) : ko.observable(obj[field]);
}

/**
 * Create an observable for all the mutable fields on an element.
 * @param element
 * @returns {*}
 */
function elementToObservables(element) {
    ELEMENT_FIELDS.forEach(function(field) {
        element[field+"Obs"] = makeObservable(element, field);
    });
    var con = element.constraints;
    if (con) {
        Object.keys(getConstraints(con.type)).forEach(function(field) {
            con[field+"Obs"] = makeObservable(con, field);
        });
        // ... and then the rules
        con.rulesObs(con.rulesObs().map(function(rule) {
            return {
                operator: ko.observable(rule.operator),
                value: ko.observable(rule.value),
                skipTo: ko.observable(rule.skipTo)
            };
        }));
    }
    return element;
}
/**
 * Copy observer values back to original element, ignoring any observables
 * that were not used (that have undefined values).
 * @param element
 * @returns {*}
 */
function observablesToElement(element) {
    ELEMENT_FIELDS.forEach(function(field) {
        updateModelField(element, field);
    });
    var con = element.constraints;
    if (con) {
        Object.keys(getConstraints(con.type)).forEach(function(field) {
            updateModelField(con, field);
        });
        element.constraints.rules = con.rulesObs().map(function(rule) {
            return {
                operator: rule.operator(),
                value: rule.value(),
                skipTo: rule.skipTo()
            };
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
    var obsName = fieldName + "Obs";
    if (typeof model[obsName]() !== "undefined") {
        model[fieldName] = model[obsName]();
    }
}
/**
 * Create a method that returns an option's label by its value.
 * @param list
 * @returns {Function}
 */
function makeFinderByLabel(list) {
    return function(value) {
        var options = list.filter(function(option) {
            return option.value === value;
        });
        return (options.length) ? options[0].label: '';
    };
}
function newSurvey() {
    return {name:'', guid:'', identifier:'', published:false, createdOn:null, elements:[], version:null};
}

module.exports = {
    newSurvey: newSurvey,
    newElement: function(type) {
        var elementType = (type === "SurveyInfoScreen") ? type : "SurveyQuestion";
        var newEl = {type: elementType};
        ko.utils.extend(newEl, ELEMENT_TEMPLATE[elementType]);
        if (elementType === "SurveyQuestion") {
            newEl.uiHint = UI_HINT_FOR_CONSTRAINTS[type];
            newEl.constraints = getConstraints(type);
            delete newEl.constraints.uiHint;
        }
        return elementToObservables(newEl);
    },
    surveyToObservables: function(vm, survey) {
        SURVEY_FIELDS.forEach(function(field) {
            vm[field+"Obs"](survey[field]);
        })
        var elements = survey.elements.map(elementToObservables);
        vm.elementsObs.pushAll(elements);
    },
    observablesToSurvey: function(vm, survey) {
        SURVEY_FIELDS.forEach(function(field) {
            survey[field] = vm[field+"Obs"]();
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
        SURVEY_FIELDS.forEach(function(field) {
            vm[field+"Obs"] = ko.observable("");
        });
        vm.elementsObs = ko.observableArray([]);
    },
    /**
     * Constraints have a *lot* of common elements, initialize them all here. This is basically a mixin where there's
     * no pattern for mixins per se in knockout.js.
     * @param vm
     * @param params
     */
    initConstraintsVM: function(vm, params) {
        vm.publishedObs = params.publishedObs;
        vm.element = params.element;
        vm.elementsObs = params.elementsObs;
        vm.formatDate = utils.formatDate;

        if (params.element.type === "SurveyQuestion") {
            vm.hasRules = function() {
                return (vm.rulesObs() !== null && vm.rulesObs().length > 0);
            };
            vm.getUiHintOptions = function(dataType) {
                return SELECT_OPTIONS_BY_TYPE[vm.element.constraints.type];
            };
            vm.editRules = function() {
                utils.openDialog('rules', {parentViewModel: vm, element: vm.element, publishedObs: vm.publishedObs});
            };

            vm.durationOptions = DURATION_OPTIONS;
            vm.rulesObs = params.element.constraints.rulesObs;
            vm.uiHintObs = params.element.uiHintObs;
            vm.fireEventObs = params.element.fireEventObs;
            vm.uiHintOptions = SELECT_OPTIONS_BY_TYPE[params.element.constraints.type];
            vm.uiHintLabel = makeFinderByLabel(vm.uiHintOptions);

            vm.unitOptions = UNIT_OPTIONS;
            vm.unitLabel = makeFinderByLabel(UNIT_OPTIONS);

            vm.operatorOptions = OPERATOR_OPTIONS;
            vm.operatorLabel = makeFinderByLabel(OPERATOR_OPTIONS);
        }
    }
};