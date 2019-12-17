import criteriaUtils from "../../criteria_utils";
import fn from "../../functions";
import root from "../../root";
import serverService from "../../services/server_service";
import tables from "../../tables";
import utils from "../../utils";

export default function() {
  let self = this;

  fn.copyProps(self, root, "isAdmin", "notificationsEnabledObs");
  fn.copyProps(self, criteriaUtils, "label");

  tables.prepareTable(self, {
    name: "topic",
    type: "NotificationTopic",
    id: "topics",
    refresh: load,
    delete: (topic) => serverService.deleteTopic(topic.guid, false),
    deletePermanently: (topic) => serverService.deleteTopic(topic.guid, true),
    undelete: (topic) => serverService.updateTopic(topic)
  });

  function initCriteria(response) {
    response.items.forEach(topic => {
      if (!fn.isDefined(topic.criteria)) {
        topic.criteria = criteriaUtils.newCriteria();
      }
    });
    return response;
  }

  function load() {
    return serverService.getAllTopics(self.showDeletedObs())
      .then(initCriteria)
      .then(fn.handleSort("items", "name"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler({ id: "topics" }));
  }
  load();
};
