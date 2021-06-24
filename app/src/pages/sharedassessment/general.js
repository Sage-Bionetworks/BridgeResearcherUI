import alerts from "../../widgets/alerts";
import optionsService from "../../services/options_service";
import serverService from "../../services/server_service";
import utils from "../../utils";
import BaseSharedAssessment from "./base_shared_assessment";

const IMPORT_MSG = "Do you want to define a new identifier for this assessment "+
  "when it is imported into your app? (Press enter to keep the current identifier)?"

export default class GeneralSharedAssessment extends BaseSharedAssessment {
  constructor(params) {
    console.log(params);
    super(params, 'sharedassessment');

    this.binder
      .bind("orgOptions[]")
      .bind("identifier")
      .bind("summary")
      .bind("revision")
      .bind("osName")
      .bind("validationStatus")
      .bind("normingStatus")
      .bind("tags[]")
      .obs("allTags[]")
      .obs("addTag");

    serverService.getTags()
      .then(this.addTags.bind(this))
      .then(optionsService.getOrganizationOptions)
      .then(opts => this.orgOptionsObs.pushAll(opts))
      .then(this.load.bind(this));
  }
  formatOrgId(orgId) {
    const orgs = this.orgOptionsObs();
    if (orgId && orgs.some(opt => opt.value === orgId)) {
      return orgs.filter(opt => opt.value === orgId)[0].label;
    }
    return orgId;
  }
  createHistoryLink() {
    return `#/sharedassessments/${this.guid}/history`;
  }
  doImport(vm, event) {
    alerts.prompt(IMPORT_MSG, (newIdentifier) => {
        utils.startHandler(vm, event);
        serverService.importSharedAssessment(this.guid, newIdentifier)
        .then(this.load.bind(this))
        .then(utils.successHandler(vm, event, "Assessment has been imported into the app."))
        .catch(this.failureHandler);
      }, this.identifierObs());
  }
  addTag() {
    let tag = this.addTagObs();
    if (tag.trim()) {
      this.tagsObs.push(tag.trim());
    }
  }
  addTags(response) {
    let array = [];
    Object.keys(response).forEach(ns => {
      let nsString = (ns === 'default') ? '' : (ns+":");
      response[ns].forEach(value => {
        array.push(nsString + value);
      });
    });
    this.allTagsObs.pushAll(array);
  }
}
