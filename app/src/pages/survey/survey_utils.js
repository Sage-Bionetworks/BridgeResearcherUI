var utils = require('../../utils');
var ko = require('knockout');
var root = require('../../root');
var fn = require('../../transforms');

var UNIT_OPTIONS = Object.freeze([
    {value: null, label: '<none>'},
    {value: 'seconds', label: 'Seconds'},
    {value: 'minutes', label: 'Minutes'},
    {value: 'hours', label: 'Hours'},
    {value: 'days', label: 'Days'},
    {value: 'weeks', label: 'Weeks'},
    {value: 'months', label: 'Months'},
    {value: 'years', label: 'Years'},
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
    {value: null, label: '<none>'},
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
    'multilinetext':'Multiline Text Field',
    'numberfield':'Number Field',
    'radiobutton':'Radio Button',
    'select':'Select Control',
    'slider':'Slider',
    'textfield':'Text Field',
    'timepicker':'Time Picker',
    'toggle':'Toggle Button'
};
var UI_HINT_OPTIONS = Object.freeze(Object.keys(uiHintLabels).reduce(function(object, key) {
    object[key] = {value: key, label: uiHintLabels[key]};
    return object;
}, {}));

var SELECT_OPTIONS_BY_TYPE = Object.freeze({
    'BooleanConstraints':[UI_HINT_OPTIONS.checkbox, UI_HINT_OPTIONS.toggle],
    'DateConstraints':[UI_HINT_OPTIONS.datepicker],
    'DateTimeConstraints':[UI_HINT_OPTIONS.datetimepicker],
    'DecimalConstraints':[UI_HINT_OPTIONS.numberfield, UI_HINT_OPTIONS.slider, UI_HINT_OPTIONS.select],
    'DurationConstraints': [UI_HINT_OPTIONS.numberfield, UI_HINT_OPTIONS.slider, UI_HINT_OPTIONS.select],
    'MultiValueConstraints':[UI_HINT_OPTIONS.checkbox, UI_HINT_OPTIONS.combobox, UI_HINT_OPTIONS.list,
        UI_HINT_OPTIONS.radiobutton, UI_HINT_OPTIONS.select, UI_HINT_OPTIONS.slider],
    'IntegerConstraints':[UI_HINT_OPTIONS.numberfield, UI_HINT_OPTIONS.slider, UI_HINT_OPTIONS.select],
    'StringConstraints':[UI_HINT_OPTIONS.multilinetext, UI_HINT_OPTIONS.textfield],
    'TimeConstraints':[UI_HINT_OPTIONS.timepicker]
});
var ELEMENT_TEMPLATE = Object.freeze({
    'SurveyInfoScreen': {type:'SurveyInfoScreen', title:'', prompt:'', promptDetail:'', identifier:''},
    'SurveyQuestion': {type:'SurveyQuestion', fireEvent:false, 'uiHint':'', prompt:'', promptDetail:'', identifier:''}
});
var DATA_TYPE_OPTIONS = Object.freeze([
    {label: 'String', value: 'string'},
    {label: 'Boolean', value: 'boolean'},
    {label: 'Date', value: 'date'},
    {label: 'Date & Time', value: 'datetime'},
    {label: 'Duration', value: 'duration'},
    {label: 'Time', value: 'time'},
    {label: 'Integer', value: 'integer'},
    {label: 'Decimal', value: 'decimal'}
]);
var CONSTRAINTS_TEMPLATES = Object.freeze({
    'BooleanConstraints': {dataType:'boolean', rules:[]},
    'DateConstraints': {dataType:'date', rules:[], allowFuture:false, earliestValue:'', latestValue:'' },
    'DateTimeConstraints': {dataType:'datetime', rules:[], allowFuture:false, earliestValue:'', latestValue:'' },
    'TimeConstraints': {dataType:'time', rules:[]},
    'IntegerConstraints': {dataType:'integer', rules:[], minValue:0, maxValue:255, unit: '', step:1.0},
    'DecimalConstraints': {dataType:'decimal', rules: [], minValue:0, maxValue:255, unit: '', step:1.0},
    'DurationConstraints': {dataType: 'duration', rules: [], minValue:0, maxValue:255, unit: '', step:1.0},
    'StringConstraints': {dataType:'string', rules: [], minLength:0, maxLength:255, pattern:'',patternPlaceholder:'',patternErrorMessage:''},
    'MultiValueConstraints': {dataType:'string', enumeration:[], rules:[], allowOther:false, allowMultiple:false}
});
var UI_HINT_FOR_CONSTRAINTS = Object.freeze({
    'BooleanConstraints': 'checkbox',
    'DateConstraints': 'datepicker',
    'DateTimeConstraints': 'datetimepicker',
    'TimeConstraints': 'timepicker',
    'IntegerConstraints': 'numberfield',
    'DecimalConstraints': 'numberfield',
    'DurationConstrains': 'numberfield',
    'StringConstraints': 'textfield',
    'MultiValueConstraints': 'list'
});

var SURVEY_FIELDS = ['name','createdOn','guid','identifier','published','version'];
var ELEMENT_FIELDS = ['prompt','promptDetail', 'title', 'uiHint','identifier','fireEvent'];

function getConstraints(type) {
    var con = {type: type};
    ko.utils.extend(con, CONSTRAINTS_TEMPLATES[type]);
    return con;
}

function makeObservable(obj, field) {
    // Strip out time zone, as this control is local time only. We may change it as well on the server
    // to use LocalDateTime, that's pending.
    if (obj.dataType === "datetime" && (field === "earliestValue" || field === "latestValue")) {
        var value = obj[field];
        if (value) {
            var matches = value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
            return ko.observable(matches && matches.length ? matches[0] : "");
        }
    }
    // Note we're copying the array when passing it to the observable, or it gets shared between properties,
    // enumeration in particular (rules is remodeled)
    return (field === "rules" || field === "enumeration") ? ko.observableArray([].concat(obj[field])) : ko.observable(obj[field]);
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
        // We do this twice for new objects... that's okay and it's necessary for correct initialization
        Object.keys(getConstraints(con.type)).forEach(function(field) {
            con[field+"Obs"] = makeObservable(con, field);
        });
        // ... and then the rules
        con.rulesObs(con.rules.map(function(rule) {
            return {
                operator: ko.observable(rule.operator),
                value: ko.observable(rule.value),
                endSurvey: ko.observable(!!rule.endSurvey),
                skipTo: ko.observable(rule.skipTo)
            };
        }));
        element.constraintsTypeObs = ko.observable(con.type);
    }

    element.changeUiHint = function(domEl) {
        var newHint = domEl.getAttribute("data-type");
        element.uiHintObs(newHint);
    };
    return element;
}
/**
 * Copy observer values back to original element, ignoring any observables
 * that were not used (that have undefined values).
 * @param element
 * @returns {*}
 */
function observablesToElement(element) {
    // because we've hidden the ability to set a UIHint, we need to adjust here based on the settings for the
    // MultiValue type:
    var con = element.constraints;
    if (con && con.typeObs() === "MultiValueConstraints" && con.allowMultipleObs()) {
        element.uiHintObs(UI_HINT_OPTIONS.checkbox.value);
    }
    ELEMENT_FIELDS.forEach(function(field) {
        updateModelField(element, field);
    });
    if (con) {
        Object.keys(getConstraints(con.type)).forEach(function(field) {
            updateModelField(con, field);
        });
        element.constraints.rules = con.rulesObs().map(function(rule) {
            var newRule = {operator: rule.operator(), value: rule.value()};
            if (rule.endSurvey()) {
                newRule.endSurvey = true;
            } else {
                newRule.skipTo = rule.skipTo();
            }
            return newRule;
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
        if (model[fieldName] === "") {
            delete model[fieldName];
        }
    }
}
function newSurvey() {
    return {name:'', guid:'', identifier:'', published:false, createdOn:null, elements:[], version:null};
}
function newField(type) {
    var elementType = (type === "SurveyInfoScreen") ? type : "SurveyQuestion";
    var newEl = {type: elementType};
    ko.utils.extend(newEl, ELEMENT_TEMPLATE[elementType]);
    if (elementType === "SurveyQuestion") {
        newEl.uiHint = UI_HINT_FOR_CONSTRAINTS[type];
        newEl.constraints = getConstraints(type);
    }
    return elementToObservables(newEl);
}
function changeElementType(oldElement, newType) {
    var newElement = newField(newType);
    newElement = elementToObservables(newElement);
    ELEMENT_FIELDS.forEach(function(field) {
        newElement[field+"Obs"](oldElement[field+"Obs"]());
    });
    // except for UI hint which is bound to constraints, but not in constraints...
    newElement.uiHintObs(newElement.uiHint);

    var bothQuestions = (oldElement.type !== "SurveyInfoScreen" && 
                         newElement.type !== "SurveyInfoScreen");
    if (bothQuestions) {
        newElement.constraints.rulesObs(oldElement.constraints.rulesObs());
        // Because they are not going to be swapped out...
        oldElement.uiHint = newElement.uiHint;
        oldElement.uiHintObs(newElement.uiHintObs());
        oldElement.constraints = newElement.constraints;
        oldElement.constraintsTypeObs(newType);
    }
    return newElement;
}

module.exports = {
    newSurvey: newSurvey,
    newField: newField,
    observablesToElement: observablesToElement,
    elementToObservables: elementToObservables,
    changeElementType: changeElementType,
    surveyToObservables: function(vm, survey) {
        SURVEY_FIELDS.forEach(function(field) {
            vm[field+"Obs"](survey[field]);
        });
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
        vm.selectedElementObs = ko.observable(0);
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
        vm.element = params.element;
        vm.elementsObs = params.elementsObs;
        vm.formatDate = fn.formatLocalDateWithoutZone;
        vm.formatDateTime = fn.formatLocalDateTime;

        if (params.element.type === "SurveyQuestion") {
            vm.hasRules = function() {
                return (vm.rulesObs() !== null && vm.rulesObs().length > 0);
            };
            vm.getUiHintOptions = function(dataType) {
                return SELECT_OPTIONS_BY_TYPE[vm.element.constraints.type];
            };
            vm.editRules = function() {
                root.openDialog('rules_editor', {parentViewModel: vm, element: vm.element});
            };

            vm.durationOptions = DURATION_OPTIONS;
            vm.durationLabel = utils.makeOptionLabelFinder(DURATION_OPTIONS);
            
            vm.rulesObs = params.element.constraints.rulesObs;
            vm.uiHintObs = params.element.uiHintObs;
            vm.fireEventObs = params.element.fireEventObs;
            vm.uiHintOptions = SELECT_OPTIONS_BY_TYPE[params.element.constraints.type];
            vm.uiHintLabel = utils.makeOptionLabelFinder(vm.uiHintOptions);
            vm.dataTypeOptions = DATA_TYPE_OPTIONS;
            vm.dataTypeLabel = utils.makeOptionLabelFinder(vm.dataTypeOptions);
            vm.unitOptions = UNIT_OPTIONS;
            vm.unitLabel = utils.makeOptionLabelFinder(UNIT_OPTIONS);

            vm.operatorOptions = OPERATOR_OPTIONS;
            vm.operatorLabel = utils.makeOptionLabelFinder(OPERATOR_OPTIONS);
        }
    }
};