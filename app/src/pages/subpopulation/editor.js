import { serverService } from "../../services/server_service";
import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import utils from "../../utils";
import ko from "knockout";

const failureHandler = utils.failureHandler({
  redirectMsg: "Consent group not found.",
  redirectTo: "subpopulations"
});

module.exports = function(params) {
  let self = this;
  self.editor = null;

  new Binder(self)
    .obs("historyItems[]")
    .obs("guid", params.guid)
    .obs("createdOn", params.createdOn || "recent")
    .obs("publishedConsentCreatedOn")
    .obs("name");

  fn.copyProps(self, fn, "formatDateTime");

  self.activeObs = ko.computed(function() {
    return self.createdOnObs() === "recent" || self.createdOnObs() === self.publishedConsentCreatedOnObs();
  });
  self.createHistoryLink = ko.computed(function() {
    return "#/subpopulations/" + self.guidObs() + "/editor/" + self.createdOnObs() + "/history";
  });

  // subpopulation fields
  serverService
    .getSubpopulation(params.guid)
    .then(fn.handleObsUpdate(self.nameObs, "name"))
    .then(fn.handleObsUpdate(self.publishedConsentCreatedOnObs, "publishedConsentCreatedOn"));

  // The editor and the request for the content can arrive in any order. bind here
  self.initEditor = (function(vm) {
    let documentContent = null;
    return function(object) {
      if (typeof object === "string") {
        // content
        documentContent = object;
      } else {
        // editor
        vm.editor = object;
      }
      if (vm.editor && documentContent) {
        vm.editor.setData(documentContent);
        documentContent = null;
      }
    };
  })(self);

  function loadIntoEditor(consent) {
    if (consent.documentContent.indexOf("<html") > -1) {
      let doc = consent.documentContent;
      consent.documentContent = doc
        .split(/<body[^>]*\>/)[1]
        .split(/<\/body\>.*/)[0]
        .trim();
    }
    self.createdOnObs(consent.createdOn);
    self.consent = consent;
    params.createdOn = consent.createdOn;
    self.initEditor(consent.documentContent);
  }

  function load() {
    return serverService.getStudyConsent(params.guid, params.createdOn);
  }
  function publishConsent(response) {
    return serverService.publishStudyConsent(params.guid, params.createdOn);
  }

  self.publish = function(vm, event) {
    alerts.confirmation("Are you sure you want to save & publish this consent?", function() {
      utils.startHandler(vm, event);

      serverService
        .saveStudyConsent(params.guid, { documentContent: self.editor.getData() })
        .then(fn.handleCopyProps(params, "createdOn"))
        .then(fn.handleObsUpdate(self.createdOnObs, "createdOn"))
        .then(publishConsent)
        .then(load)
        .then(loadIntoEditor)
        .then(utils.successHandler(vm, event, "Consent published"))
        .catch(failureHandler);
    });
  };
  self.save = function(vm, event) {
    utils.startHandler(self, event);

    serverService
      .saveStudyConsent(params.guid, { documentContent: self.editor.getData() })
      .then(loadIntoEditor)
      .then(utils.successHandler(vm, event, "Consent saved."))
      .catch(failureHandler);
  };

  function studyConsent() {
    return params.createdOn ? 
      serverService.getStudyConsent(params.guid, params.createdOn) : 
      serverService.getMostRecentStudyConsent(params.guid);
  }
  studyConsent()
    .then(loadIntoEditor)
    .catch(failureHandler);
};
module.exports.prototype.dispose = function() {
  if (this.editor) {
    this.editor.destroy();
  }
};
