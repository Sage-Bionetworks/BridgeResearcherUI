import alerts from "../../widgets/alerts";
import BaseAssessment from "./base_assessment";
import ko from "knockout";
import serverService from "../../services/server_service";
import utils from "../../utils";

function findByIdAndProp(data, nodeId, propName) {
  if (data && data.identifier === nodeId && data[propName]) {
    return data[propName];
  }
  if (Array.isArray(data)) {
    for (let i=0; i < data.length; i++) {
      let valueObj = data[i];
      let val = findByIdAndProp(valueObj, nodeId, propName);
      if (val) { return val; }
    }
  } else if (data !== null && typeof data === 'object') {
    for (let fieldName in data) {
      let valueObj = data[fieldName];
      let val = findByIdAndProp(valueObj, nodeId, propName);
      if (val) { return val; }
    }
  }
  return null;
}

function convertValue(type, value) {
  if (type === 'boolean') {
    return value === 'true';
  } else if (type === 'number') {
    return Number.parseInt(value);
  }
  return value;
}

export default class AssessmentCustomize extends BaseAssessment {
  constructor(params) {
    super(params, 'assessment-customize');

    this.binder.obs("editors[]");

    super.load()
      .then(() => serverService.getAssessmentConfig(params.guid))
      .then(this.binder.assign('config'))
      .then(response => this.data = response.config)
      .then(this.updateEditors.bind(this))
      .catch(this.failureHandler);
  }
  save(vm, event) {
    utils.startHandler(vm, event);

    let map = {};
    for (let i=0; i < this.editorsObs().length; i++) {
      let editor = this.editorsObs()[i];
      if (!map[editor.fieldIdentifier]) {
        map[editor.fieldIdentifier] = {};
      }
      map[editor.fieldIdentifier][editor.propName] = 
        convertValue(editor.propType, editor.valueObs());
    }
    serverService.customizeAssessmentConfig(this.guidObs(), map)
      .then(this.binder.update())
      .then(utils.successHandler(vm, event, "Assessment configuration has been customized."))
      .catch(this.failureHandler);
  }
  unlink(vm, event) {
    alerts.deleteConfirmation("Are you sure? We cannot undo this.", () => {
      serverService.updateAssessmentConfig(this.guidObs(), this.config)
        .then(() => document.location = `#/assessments/${this.guidObs()}/config`);
    }, "Delete");
  }
  updateEditors() {
    let cf = this.assessment.customizationFields || {};
    Object.keys(cf).forEach(fieldIdentifier => {
      for (let i=0; i < cf[fieldIdentifier].length; i++) {
        let editor = cf[fieldIdentifier][i];
        editor.fieldIdentifier = fieldIdentifier;
        editor.valueObs = ko.observable(findByIdAndProp(this.data, fieldIdentifier, editor.propName));
        this.editorsObs.push(editor);
      }
    });
  }
}