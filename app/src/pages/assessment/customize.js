import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import utils from "../../utils";

var failureHandler = utils.failureHandler({
  redirectMsg: "Assessment not found.",
  redirectTo: "assessments",
  transient: false,
  id: 'assessment_customize'
});

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

export default function(params) {
  let self = this;

  let binder = new Binder(self)
    .obs("isNew", false)
    .obs("guid", params.guid)
    .obs("originGuid")
    .obs("pageTitle", "New Assessment")
    .obs("pageRev")
    .obs("editors[]")
    .obs("canEdit", false);

  self.save = function(vm, event) {
    utils.startHandler(vm, event);

    let map = {};
    for (let i=0; i < self.editorsObs().length; i++) {
      let editor = self.editorsObs()[i];
      if (!map[editor.fieldIdentifier]) {
        map[editor.fieldIdentifier] = {};
      }
      map[editor.fieldIdentifier][editor.propName] = 
        convertValue(editor.propType, editor.valueObs());
    }

    serverService.customizeAssessmentConfig(params.guid, map)
      .then(binder.update())
      .then(utils.successHandler(vm, event, "Assessment configuration has been customized."))
      .catch(failureHandler);
  };
  self.unlink = function(vm, event) {
    alerts.deleteConfirmation("Are you sure? We cannot undo this.", function() {
      serverService.updateAssessmentConfig(params.guid, self.config)
        .then(() => document.location = `#/assessments/${params.guid}/config`);
    }, "Delete");    
  };

  function updateEditors() {
    let cf = self.assessment.customizationFields || {};
    Object.keys(cf).forEach(fieldIdentifier => {
      for (let i=0; i < cf[fieldIdentifier].length; i++) {
        let editor = cf[fieldIdentifier][i];
        editor.fieldIdentifier = fieldIdentifier;
        editor.valueObs = ko.observable(findByIdAndProp(self.data, fieldIdentifier, editor.propName));
        self.editorsObs.push(editor);
      }
    });
  }
  
  serverService.getAssessment(params.guid)
    .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
    .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
    .then(fn.handleObsUpdate(self.originGuidObs, "originGuid"))
    .then(binder.assign('assessment'))
    .then(() => serverService.getAssessmentConfig(params.guid))
    .then(binder.assign('config'))
    .then((response) => self.data = response.config)
    .then(updateEditors)
    .then(serverService.getSession)
    .then((session) => self.canEditObs(fn.canEditAssessment(self.assessment, session)));
};
