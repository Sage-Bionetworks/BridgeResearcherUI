"use strict";

var utils = require('../../utils');
var ko = require('knockout');

var SCHEMA_TYPE_OPTIONS = Object.freeze([
    {value: 'ios_survey', label: 'iOS Survey'},
    {value: 'ios_data', label: 'iOS Data'}
]);

var FIELD_TYPE_OPTIONS = Object.freeze([
    {value: 'attachment_blob', label: 'Blob Attachment'},
    {value: 'attachment_csv', label: 'CSV Attachment'},
    {value: 'attachment_json_blob', label: 'JSON Blob Attachment'},
    {value: 'attachment_json_table', label: 'JSON Table'},
    {value: 'boolean', label: 'Boolean'},
    {value: 'float', label: 'Float'},
    {value: 'inline_json_blob', label: 'Inline JSON Blob'},
    {value: 'int', label: 'Integer'},
    {value: 'string', label: 'String'},
    {value: 'calendar_date', label: 'Date'},
    {value: 'timestamp', label: 'Date & Time'}
]);

module.exports = {
    newField: function() {
        return {
            nameObs: ko.observable(""),
            requiredObs: ko.observable(false),
            typeObs: ko.observable('attachment_blob')
        };
    },
    initSchemasVM: function(vm) {
        vm.schemaTypeLabel = utils.makeFinderByLabel(SCHEMA_TYPE_OPTIONS);
    },
    initVM: function(vm) {
        vm.schemaTypeOptions = SCHEMA_TYPE_OPTIONS;
        vm.schemaTypeLabel = utils.makeFinderByLabel(SCHEMA_TYPE_OPTIONS);
        vm.fieldTypeOptions = FIELD_TYPE_OPTIONS;
        vm.fieldTypeLabel = utils.makeFinderByLabel(FIELD_TYPE_OPTIONS);
    },
    initFieldDefinitionVM: function(vm) {
        vm.fieldTypeOptions = FIELD_TYPE_OPTIONS;
        vm.fieldTypeLabel = utils.makeFinderByLabel(FIELD_TYPE_OPTIONS);
    }
};