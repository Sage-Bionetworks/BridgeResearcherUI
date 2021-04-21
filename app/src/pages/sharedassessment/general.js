import alerts from "../../widgets/alerts";
import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import utils from "../../utils";

const IMPORT_MSG = "Do you want to define a new identifier for this assessment "+
  "when it is imported into your app? (Press enter to keep the current identifier)?"

var failureHandler = utils.failureHandler({
  redirectMsg: "Shared assessment not found.",
  redirectTo: "sharedassessments",
  transient: false,
  id: 'sharedassessment'
});

export default function(params) {
  let self = this;
  self.assessment = null;

  fn.copyProps(self, fn, "formatDateTime");

  self.osNameOpts = [
    {label: "Android", value: "Android"},
    {label: "iOS", value: "iPhone OS"},
    {label: "Both (Universal)", value: "Universal"}
  ];

  let binder = new Binder(self)
    .obs("guid")
    .obs("createdOn")
    .obs("modifiedOn")
    .obs("pageTitle")
    .obs("pageRev")
    .bind("title")
    .bind("version")
    .bind("identifier")
    .bind("summary")
    .bind("revision")
    .bind("ownerId")
    .bind("orgOptions[]")
    .bind("osName")
    .bind("originGuid")
    .bind("validationStatus")
    .bind("normingStatus")
    .bind("tags[]")
    .obs("allTags[]")
    .obs("addTag")
    .obs("canEdit", false);
  fn.copyProps(self, fn, "formatDateTime");

  self.createHistoryLink = ko.computed(function() {
    return "#/sharedassessments/" + self.guidObs() + "/history";
  });

  function saveAssessment() {
    return serverService.updateSharedAssessment(self.assessment)
      .then(binder.assign("assessment"))
      .then(binder.update())
      .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
      .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
      .then(fn.handleObsUpdate(self.originGuidObs, "originGuid"))
      .then(fn.handleCopyProps(params, "guid"))
      .then(fn.returning(self.assessment));
  }
  function load() {
    return serverService.getSharedAssessment(params.guid)
      .then(binder.assign("assessment"))
      .then(binder.update())
      .then(fn.handleObsUpdate(self.pageTitleObs, "title"))
      .then(fn.handleObsUpdate(self.pageRevObs, "revision"))
      .then(serverService.getSession)
      .then((session) => self.canEditObs(fn.canEditAssessment(self.assessment, session)));
  }

  self.doImport = function(vm, event) {
    alerts.prompt(IMPORT_MSG, function(newIdentifier) {
        utils.startHandler(vm, event);
        serverService.importSharedAssessment(params.guid, newIdentifier)
        .then(load)
        .then(utils.successHandler(vm, event, "Assessment has been imported into the app."))
        .catch(failureHandler);
      }, self.identifierObs());
  }

  self.save = function(vm, event) {
    self.assessment = binder.persist(self.assessment);

    utils.startHandler(vm, event);
    saveAssessment()
      .then(utils.successHandler(vm, event, "Shared assessment has been saved."))
      .catch(failureHandler);
  };

  self.formatOrgId = function(orgId) {
    const orgs = self.orgOptionsObs();
    if (orgId && orgs.some(opt => opt.value === orgId)) {
      return orgs.filter(opt => opt.value === orgId)[0].label;
    }
    return orgId;
  }
  self.addTag = function() {
    let tag = self.addTagObs();
    if (tag.trim()) {
      self.tagsObs.push(tag.trim());
    }
  }
  function addTags(response) {
    let array = [];
    Object.keys(response).forEach(ns => {
      let nsString = (ns === 'default') ? '' : (ns+":");
      response[ns].forEach(value => {
        array.push(nsString + value);
      });
    });
    self.allTagsObs.pushAll(array);
  }

  serverService.getTags()
    .then(addTags)
    .then(optionsService.getOrganizationOptions)
    .then((opts) => self.orgOptionsObs.pushAll(opts))
    .then(load);
};
