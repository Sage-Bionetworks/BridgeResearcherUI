var utils = require('../../utils');

var SCHEMA_TYPE_OPTIONS = Object.freeze([
    {value: 'ios_survey', label: 'iOS Survey'},
    {value: 'ios_data', label: 'iOS Data'}
]);

// Note: some of these fields are marked deprecated because they are only used to create schemas 
// automatically when surveys are published. They aren't in the UI for creating new data schemas.
var ALL_FIELD_TYPE_OPTIONS = Object.freeze([
    {label: "Attachment", value: "attachment_v2", deprecated:false, extra_fields: 'attachment'},
    {label: "Boolean", value: "boolean", deprecated:false, extra_fields: 'none'},
    {label: "Date (no time of day)", value: "calendar_date", deprecated:false, extra_fields: 'none'},
    {label: "Date & Time/Timestamp", value: "timestamp", deprecated:false, extra_fields: 'none'},
    {label: "Decimal", value: "float", deprecated:false, extra_fields: 'none'},
    {label: "Inline JSON Blob", value: "inline_json_blob", deprecated:false, extra_fields: 'string'},
    {label: "Integer", value: "int", deprecated:false, extra_fields: 'none'},
    {label: "String", value: "string", deprecated:false, extra_fields: 'string'},
    {label: "Time of Day (no date)", value: "time_v2", deprecated:false, extra_fields: 'none'},

    {label: "Blob Attachment", value: "attachment_blob", deprecated:true, extra_fields: 'none'},
    {label: "CSV Attachment", value: "attachment_csv", deprecated:true, extra_fields: 'none'},
    {label: "JSON Blob Attachment", value: "attachment_json_blob", deprecated:true, extra_fields: 'none'},
    {label: "JSON Table", value: "attachment_json_table", deprecated:true, extra_fields: 'none'},
    {label: "Multi-Choice", value: "multi_choice", deprecated:true, extra_fields: 'none'},
    {label: "Single-Choice", value: "single_choice", deprecated:true, extra_fields: 'none'},
    {label: "Duration", value: "duration_v2", deprecated:true, extra_fields: 'none'},
    {label: "Timestamp", value: "timestamp", deprecated:true, extra_fields: 'none'}
]);

var FIELD_TYPE_OPTIONS = Object.freeze(ALL_FIELD_TYPE_OPTIONS.filter(function(option) {
    return !option.deprecated;
}));

// Just some frequently used mime types to aid editors. Can easily add or remove from this list.
var MIME_TYPES = Object.freeze([
    {title:"application/json", ext:".json"},
    {title:"application/octet-stream", ext:".bin"},
    {title:"image/jpeg", ext:".jpg"},
    {title:"image/png", ext:".png"},
    {title:"text/csv", ext:".csv"},
    {title:"text/plain", ext:".txt"},
    {title:"text/tab-separated-values", ext:".tsv"}
]);

var TYPE_LOOKUP = ALL_FIELD_TYPE_OPTIONS.reduce(function(obj, type) {
    obj[type.value] = type;
    return obj;
}, {});

module.exports = {
    TYPE_LOOKUP: TYPE_LOOKUP,
    // refs: schemas.js
    initSchemasVM: function(vm) {
        vm.schemaTypeLabel = utils.makeOptionLabelFinder(SCHEMA_TYPE_OPTIONS);
    },
    // refs: schema.js, survey_schema.js
    initVM: function(vm) {
        vm.schemaTypeOptions = SCHEMA_TYPE_OPTIONS;
        vm.schemaTypeLabel = utils.makeOptionLabelFinder(SCHEMA_TYPE_OPTIONS);
        vm.fieldTypeOptions = ALL_FIELD_TYPE_OPTIONS;
        vm.fieldTypeLabel = utils.makeOptionLabelFinder(ALL_FIELD_TYPE_OPTIONS);
    },
    // refs: field_definitions.js
    initFieldDefinitionVM: function(vm, type) {
        vm.mimeTypes = MIME_TYPES;
        var schemaType = TYPE_LOOKUP[type];
        if (schemaType && schemaType.deprecated) {
            var options = FIELD_TYPE_OPTIONS.map(function(e) { return e; });
            options.push(schemaType);
            vm.fieldTypeOptions = options;
        } else {
            vm.fieldTypeOptions = FIELD_TYPE_OPTIONS;
        }
        vm.fieldTypeLabel = utils.makeOptionLabelFinder(vm.fieldTypeOptions);
    }
};