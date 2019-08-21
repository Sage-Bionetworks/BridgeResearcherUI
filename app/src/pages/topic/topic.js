import Binder from "../../binder";
import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

const failureHandler = utils.failureHandler({
  redirectTo: "topics",
  redirectMsg: "Push notification topic not found."
});

function newTopic() {
  return {
    name: "New Topic",
    shortName: "",
    guid: "",
    description: "",
    criteria: criteriaUtils.newCriteria()
  };
}

export default function(params) {
  let self = this;
  self.topic = {};

  fn.copyProps(self, criteriaUtils, "label->criteriaLabel");
  self.openCriteriaDialog = function() {
    root.openDialog("criteria_editor", { criteriaObs: self.criteriaObs });
  };

  let binder = new Binder(self)
    .obs("isNew", params.guid === "new")
    .obs("title")
    .obs("createdOn", "", fn.formatDateTime)
    .obs("modifiedOn", "", fn.formatDateTime)
    .bind("name")
    .bind("shortName")
    .bind("guid")
    .bind("description")
    .bind("criteria");

  function updateTopic(response) {
    self.titleObs(self.topic.name);
    self.isNewObs(false);
    self.guidObs(response.guid);
    let d = fn.formatDateTime();
    if (!self.createdOnObs()) {
      // Just fake this
      self.createdOnObs(d);
    }
    self.modifiedOnObs(d);
    return response;
  }

  fn.copyProps(self, root, "isAdmin");

  self.sendNotification = function(vm, event) {
    root.openDialog("send_notification", { topicId: self.guidObs() });
  };

  function saveTopic(topic) {
    return self.isNewObs() ? serverService.createTopic(topic) : serverService.updateTopic(topic);
  }
  // existing topics will not have this
  function initCriteria(topic) {
    if (!fn.isDefined(topic.criteria)) {
      topic.criteria = criteriaUtils.newCriteria();
    }
    return topic;
  }

  self.save = function(vm, event) {
    self.topic = binder.persist(self.topic);

    utils.startHandler(vm, event);
    saveTopic(self.topic)
      .then(updateTopic)
      .then(utils.successHandler(vm, event, "Topic has been saved."))
      .catch(utils.failureHandler());
  };

  if (params.guid !== "new") {
    serverService.getTopic(params.guid)
      .then(fn.handleObsUpdate(self.titleObs, "name"))
      .then(initCriteria)
      .then(binder.assign("topic"))
      .then(binder.update())
      .catch(failureHandler);
  } else {
    Promise.resolve(newTopic())
      .then(fn.handleObsUpdate(self.titleObs, "name"))
      .then(binder.assign("topic"))
      .then(binder.update());
  }
};
