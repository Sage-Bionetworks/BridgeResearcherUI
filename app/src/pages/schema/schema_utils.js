import utils from "../../utils";
import Binder from "../../binder";

const FIELD_SKELETON = {
  name: "",
  required: false,
  type: null,
  unboundedText: false,
  maxLength: "100",
  fileExtension: "",
  mimeType: "",
  multiChoiceAnswerList: [],
  allowOtherChoices: false
};

const SCHEMA_TYPE_OPTIONS = Object.freeze([
  { value: "ios_data", label: "iOS Data" },
  { value: "ios_survey", label: "iOS Survey" }
]);

// Note: some of these fields are marked deprecated because they are only used to create schemas
// automatically when surveys are published. They aren't in the UI for creating new data schemas.
const ALL_FIELD_TYPE_OPTIONS = Object.freeze([
  { label: "Attachment", value: "attachment_v2", deprecated: false, extra_fields: "attachment" },
  { label: "Large Text Attachment", value: "large_text_attachment", deprecated: false, extra_fields: "none" },
  { label: "Boolean", value: "boolean", deprecated: false, extra_fields: "none" },
  { label: "Date (no time of day)", value: "calendar_date", deprecated: false, extra_fields: "none" },
  { label: "Date & Time/Timestamp", value: "timestamp", deprecated: false, extra_fields: "none" },
  { label: "Decimal", value: "float", deprecated: false, extra_fields: "none" },
  { label: "Inline JSON Blob", value: "inline_json_blob", deprecated: false, extra_fields: "string" },
  { label: "Integer", value: "int", deprecated: false, extra_fields: "none" },
  { label: "String", value: "string", deprecated: false, extra_fields: "string" },
  { label: "Time of Day (no date)", value: "time_v2", deprecated: false, extra_fields: "none" },
  { label: "Multi-Choice", value: "multi_choice", deprecated: false, extra_fields: "multi" },
  { label: "Single-Choice", value: "single_choice", deprecated: false, extra_fields: "single" },

  { label: "Blob Attachment", value: "attachment_blob", deprecated: true, extra_fields: "none" },
  { label: "CSV Attachment", value: "attachment_csv", deprecated: true, extra_fields: "none" },
  { label: "JSON Blob Attachment", value: "attachment_json_blob", deprecated: true, extra_fields: "none" },
  { label: "JSON Table", value: "attachment_json_table", deprecated: true, extra_fields: "none" },
  { label: "Duration", value: "duration_v2", deprecated: true, extra_fields: "none" },
  { label: "Timestamp", value: "timestamp", deprecated: true, extra_fields: "none" }
]);

const FIELD_TYPE_OPTIONS = Object.freeze(
  ALL_FIELD_TYPE_OPTIONS.filter(function(option) {
    return !option.deprecated;
  })
);

// Just some frequently used mime types to aid editors. Can easily add or remove from this list.
const MIME_TYPES = Object.freeze([
  { title: "application/json", ext: ".json" },
  { title: "application/octet-stream", ext: ".bin" },
  { title: "image/jpeg", ext: ".jpg" },
  { title: "image/png", ext: ".png" },
  { title: "text/csv", ext: ".csv" },
  { title: "text/plain", ext: ".txt" },
  { title: "text/tab-separated-values", ext: ".tsv" }
]);

const TYPE_LOOKUP = ALL_FIELD_TYPE_OPTIONS.reduce(function(obj, type) {
  obj[type.value] = type;
  return obj;
}, {});

function initSchemasVM(vm) {
  vm.schemaTypeLabel = utils.makeOptionLabelFinder(SCHEMA_TYPE_OPTIONS);
}

function initVM(vm) {
  vm.schemaTypeOptions = SCHEMA_TYPE_OPTIONS;
  vm.schemaTypeLabel = utils.makeOptionLabelFinder(SCHEMA_TYPE_OPTIONS);
  vm.fieldTypeOptions = ALL_FIELD_TYPE_OPTIONS;
  vm.fieldTypeLabel = utils.makeOptionLabelFinder(ALL_FIELD_TYPE_OPTIONS);
}

function fieldDefToObs(fieldDefinitions) {
  return fieldDefinitions.map(function(def) {
    new Binder(def)
      .bind("name", def.name)
      .bind("required", def.required)
      .bind("type", def.type)
      .bind("unboundedText", def.unboundedText)
      .bind("maxLength", def.maxLength)
      .bind("fileExtension", def.fileExtension)
      .bind("allowOtherChoices", def.allowOtherChoices)
      .bind("multiChoiceAnswerList[]", [].concat(def.multiChoiceAnswerList || []))
      .bind("mimeType", def.mimeType);
    return def;
  });
}

function fieldObsToDef(fieldDefinitions) {
  let fields = [];
  fieldDefinitions.forEach(function(item) {
    let type = item.typeObs();
    if (!type) {
      return;
    }
    let field = {
      name: item.nameObs(),
      required: item.requiredObs(),
      type: type
    };
    if (type === "string" || type === "inline_json_blob" || type === "single_choice") {
      field.unboundedText = item.unboundedTextObs();
      if (!field.unboundedText) {
        field.maxLength = item.maxLengthObs();
      }
    } else if (type === "attachment_v2") {
      field.mimeType = item.mimeTypeObs();
      let ext = item.fileExtensionObs();
      if (!/^\./.test(ext)) {
        ext = "." + ext;
      }
      field.fileExtension = ext;
    } else if (type === "multi_choice") {
      field.multiChoiceAnswerList = item.multiChoiceAnswerListObs();
      field.allowOtherChoices = item.allowOtherChoicesObs();
    }
    fields.push(field);
  });
  return fields;
}

function makeNewField() {
  return fieldDefToObs([Object.assign({}, FIELD_SKELETON)])[0];
}

function initFieldDefinitionVM(vm, type) {
  vm.mimeTypes = MIME_TYPES;
  let schemaType = TYPE_LOOKUP[type];
  if (schemaType && schemaType.deprecated) {
    let options = FIELD_TYPE_OPTIONS.map(function(e) {
      return e;
    });
    options.push(schemaType);
    vm.fieldTypeOptions = options;
  } else {
    vm.fieldTypeOptions = FIELD_TYPE_OPTIONS;
  }
  vm.fieldTypeLabel = utils.makeOptionLabelFinder(vm.fieldTypeOptions);
}

export { TYPE_LOOKUP, fieldDefToObs, fieldObsToDef, makeNewField, initSchemasVM, initVM, initFieldDefinitionVM };
