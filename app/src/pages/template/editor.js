import Binder from "../../binder";
import config from "../../config";
import fn from "../../functions";
import ko from "knockout";
import serverService from "../../services/server_service";
import utils from "../../utils";

const TITLES = config.templateTitles;

export default function(params) {
  let self = this;

  self.formatDateTime = fn.formatDateTime;
  self.template = null;

  new Binder(self)
    .obs("title", "New Template")
    .obs("active", false)
    .obs("guid", params.guid)
    .obs("createdOn", params.createdOn)
    .obs("templateType", params.templateType)
    .obs("isEmail", params.templateType.startsWith("email_"))
    .obs("templateTitle", TITLES[params.templateType] + ' templates')
    .obs("subject", "")
    .obs("documentContent", "")
    .obs("mimeType", "")
    .obs("appId");

  self.publish = function(vm, e) {
    let content = (self.isEmailObs()) ? this.editor.getData() : self.documentContentObs().trim();
    let revision = {templateGuid: self.guidObs(), subject: self.subjectObs(),
      documentContent: content, mimeType: self.mimeTypeObs()};

    utils.startHandler(vm, e);
    serverService.createTemplateRevision(self.guidObs(), revision)
      .then(fn.handleObsUpdate(self.createdOnObs, "createdOn"))
      .then(fn.handleObsUpdate(self.activeObs, false))
      .then(() => serverService.publishTemplateRevision(params.guid, self.createdOnObs()))
      .then(utils.successHandler(vm, e, "Revision saved and published."))
      .then(() => self.activeObs(true))
      .catch(utils.failureHandler());
  };
  self.save = function(vm, e) {
    let content = (self.isEmailObs()) ? this.editor.getData() : self.documentContentObs().trim();
    let revision = {templateGuid: self.guidObs(), subject: self.subjectObs(),
      documentContent: content, mimeType: self.mimeTypeObs()};

    utils.startHandler(vm, e);
    serverService.createTemplateRevision(self.guidObs(), revision)
      .then(fn.handleObsUpdate(self.createdOnObs, "createdOn"))
      .then(fn.handleObsUpdate(self.activeObs, false))
      .then(utils.successHandler(vm, e, "Revision saved."))
      .catch(utils.failureHandler())
  };
  self.createHistoryLink = ko.computed(() => {
    return `/templates/${self.templateTypeObs()}/${self.guidObs()}/editor/${self.createdOnObs()}/history`;
  });
  self.initEditor = ckeditor => {
    this.editor = ckeditor;
    if (self.documentContentObs()) {
      self.editor.setData(self.documentContentObs());
    }
  };

  function initTemplate(template) {
    self.template = template;
    if (!self.createdOnObs()) {
      self.createdOnObs(template.publishedCreatedOn);
    }
    self.activeObs(self.createdOnObs() === template.publishedCreatedOn);
    return template;
  }
  function initEditorContent() {
    if (self.editor) {
      self.editor.setData(self.documentContentObs());
    }
  }

  serverService.getApp()
    .then(app => self.appIdObs(app.identifier))
    .then(() => serverService.getTemplate(params.guid))
    .then(fn.handleObsUpdate(self.titleObs, "name"))
    .then(initTemplate)
    .then(() => serverService.getTemplateRevision(self.guidObs(), self.createdOnObs()))
    .then(fn.handleObsUpdate(self.subjectObs, "subject"))
    .then(fn.handleObsUpdate(self.documentContentObs, "documentContent"))
    .then(fn.handleObsUpdate(self.mimeTypeObs, "mimeType"))
    .then(initEditorContent);
};
