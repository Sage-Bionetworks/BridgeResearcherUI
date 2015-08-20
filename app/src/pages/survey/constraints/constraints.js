var $ = require('jquery');

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

module.exports = function(params) {
    var self = this;

    self.element = params.element;
    self.publishedObs = params.publishedObs;

    self.formatDate = function(date) {
        console.log(date);
        return new Date(date).toDateString();
    };
    self.editEnum = function() {
        alert("editEnum: Not implemented");
    };
    self.addRule = function() {
        alert("addRule: Not implemented");
    };
    self.uiHintLabel = function(uiHint) {
        return uiHintLabels[self.element.uiHint];
    };
    self.getOptions = function(dataType) {
        return selectOptionsByType[self.element.constraints.type];
    };
    $(".ui.checkbox").checkbox();
};