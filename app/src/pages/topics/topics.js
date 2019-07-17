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
    refresh: load,
    delete: function(topic) {
      return serverService.deleteTopic(topic.guid, false);
    },
    deletePermanently: function(topic) {
      return serverService.deleteTopic(topic.guid, true);
    },
    undelete: function(topic) {
      return serverService.updateTopic(topic);
    }
  });

  function initCriteria(response) {
    response.items.forEach(topic => {
      if (!fn.isDefined(topic.criteria)) {
        topic.criteria = criteriaUtils.newCriteria();
      }
    });
    return response;
  }

  function getTopics() {
    return serverService.getAllTopics(self.showDeletedObs());
  }

  function load() {
    getTopics()
      .then(initCriteria)
      .then(fn.handleSort("items", "name"))
      .then(fn.handleObsUpdate(self.itemsObs, "items"))
      .catch(utils.failureHandler());
  }
  load();
};
