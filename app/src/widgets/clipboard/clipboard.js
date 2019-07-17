import "knockout-postbox";
import ko from "knockout";
import optionsService from "../../services/options_service";
import Promise from "bluebird";
import serverService from "../../services/server_service";
import storeService from "../../services/store_service";
import utils from "../../utils";

/**
 * There are a lot of rules for the clipboard:
 *
 * = to simplify dependency tracking, you can add in piecemeal, but must copy or remove all items from the clipboard.
 *
 * = when copying, depending on the type, we'll add dependencies to the clipboard. They are:
 *      - subpopulations, also add published study consent
 *      - schedules, add task identifiers and surveys
 *      - schedules with eventIds pointing to other schedules, add in that schedule
 *      - subpopulations and schedule plans, add referenced data groups
 *
 * = when creating surveys, we keep a record of their new guid/createdOn keys in the new study
 *
 * = when creating schedule plans, we keep a record of the new guids for activities
 *
 * = also when creating surveys, you're copying the most recently published, for the moment.
 *
 * = when creating schedules, we first publish any surveys that are referenced in the schedule
 *
 * = when pasting, we work in a specific order: add task identifiers, surveys, schedules, subpopulations,
 *  and then the study consent for that subpopulation.
 *
 * = when schedules are updated, then the labels for the scheduleplan don't have the labels [BUG?]
 */

// Add new stuff to the DEPENDENCY_ORDER and MODEL_METADATA objects, and then don't forget to update your
// tables.prepareTable() call to include type and refresh config keys.
const DEPENDENCY_ORDER = [
  "DataGroup",
  "Subpopulation",
  "StudyConsent",
  "Survey",
  "TaskReference",
  "CompoundActivityDefinition",
  "UploadSchema",
  "SchedulePlan",
  "NotificationTopic"
];

const RESERVED_WORDS = (
  "access add all alter and any as asc audit between by char check cluster column column_value comment compress " +
  "connect create current date decimal default delete desc distinct drop else exclusive exists false file float for from " +
  "grant group having identified immediate in increment index initial insert integer intersect into is level like lock long" +
  "maxextents minus mlslabel mode modify nested_table_id noaudit nocompress not nowait null number of offline on online option" +
  "or order pctfree prior public raw rename resource revoke row row_id row_version rowid rownum rows select session set share " +
  "size smallint start successful synonym sysdate table then time to trigger true uid union unique update user validate values " +
  "varchar varchar2 view whenever where with"
).split(" ");

const clipboardEntries = ko.observableArray();

function getCopy(model) {
  return Promise.resolve(JSON.parse(JSON.stringify(model)));
}
function getSame(model) {
  return Promise.resolve(model);
}

const MODEL_METADATA = {};
/**
 * MODEL_METADATA entries contain the following information:
 * primaryKeys: each of these fields will be tested for equality with existing models and if all keys are
 *      equal on one of the models, it should not be added to the clipboard
 * label: the field that will be used to display the entity in the clipboard
 * getMethod: method to retrieve a clean copy of the model to copy. In some cases it is necessary to query
 *      the server to get a complete object rather than a partial object used for list views
 * copyMethod: add this item and any dependents to the clipboard. In theory these can be added in any
 *      order, because we have logic to do the paste from the bottom of the dependency tree upwards.
 * pasteMethod: the method to call to "paste" the item into the new target study, usually a create method.
 */
MODEL_METADATA.UploadSchema = {
  primaryKeys: ["schemaId", "revision"],
  label: "name",
  getMethod: getCopy,
  pasteMethod: function(schema) {
    return serverService.createUploadSchema(schema);
  }
};
MODEL_METADATA.Subpopulation = {
  primaryKeys: ["guid"],
  label: "name",
  getMethod: getCopy,
  copyMethod: function(subpop) {
    if (subpop.criteria) {
      subpop.criteria.allOfGroups.forEach(copyDataGroupToClipboard);
      subpop.criteria.noneOfGroups.forEach(copyDataGroupToClipboard);
    }
    let createdOn = subpop.publishedConsentCreatedOn;
    return serverService.getStudyConsent(subpop.guid, createdOn).then(function(response) {
      response.label = "Consent for " + subpop.name;
      clipboard.copy("StudyConsent", response);
      return subpop;
    });
  },
  pasteMethod: function(subpop) {
    // After creating subpopulation copy, get the new guid and set it for the study consent
    // so it will pass when it is copied.
    let studyConsent = clipboardEntries().filter(function(model) {
      return model.type === "StudyConsent" && model.subpopulationGuid === subpop.guid;
    })[0];
    return serverService.createSubpopulation(subpop).then(function(response) {
      studyConsent.subpopulationGuid = response.guid;
      return response;
    });
  }
};

MODEL_METADATA.SchedulePlan = {
  primaryKeys: ["guid"],
  label: "label",
  getMethod: getCopy,
  copyMethod: function(plan) {
    // Add criteria data groups referenced by schedules.
    findDataGroups(plan).forEach(function(dataGroup) {
      clipboard.copy("DataGroup", {
        value: dataGroup,
        label: "Data group: " + dataGroup,
        type: "DataGroup"
      });
    });
    let schedules = optionsService.getSchedules(plan);
    let activities = [];
    schedules.forEach(function(schedule) {
      schedule.activities.forEach(function(activity) {
        activities.push(activity);
      });
    });
    // Add tasks and schedules referenced in activities
    activities.forEach(function(act) {
      if (act.task) {
        act.task.label = "Task ID for " + act.label;
        clipboard.copy("TaskReference", act.task);
      } else if (act.survey) {
        // this is missing when survey is published, we need it though for proper URL
        act.survey.createdOn = act.survey.createdOn || "published";
        MODEL_METADATA.Survey.getMethod(act.survey).then(function(survey) {
          delete act.survey.createdOn;
          clipboard.copy("Survey", survey);
        });
      } else if (act.compoundActivity) {
        clipboard.copy("CompoundActivityDefinition", act.compoundActivity);
      }
    });

    // Add the activity referenced in any eventIds
    schedules.forEach(function(schedule) {
      if (/^activity:/.test(schedule.eventId)) {
        let guid = schedule.eventId.split(":")[1];
        findSchedulePlanByActivityGuid(guid).then(function(foundPlan) {
          clipboard.copy("SchedulePlan", foundPlan);
        });
      }
    });
    return plan;

    function findDataGroups(survey) {
      if (!survey.strategy.scheduleCriteria) {
        return [];
      }
      return survey.strategy.scheduleCriteria
        .map(function(scheduleCriteria) {
          return scheduleCriteria.criteria;
        })
        .reduce(function(array, criteria) {
          return array.concat(criteria.allOfGroups).concat(criteria.noneOfGroups);
        }, [])
        .filter(function(item, i, array) {
          return array.indexOf(item) === i;
        });
    }
    function findSchedulePlanByActivityGuid(guid) {
      return serverService.getSchedulePlans().then(function(response) {
        return response.items.filter(function(plan) {
          return optionsService.getActivities(plan).some(function(act) {
            return act.guid === guid;
          });
        })[0];
      });
    }
  },
  pasteMethod: function(plan) {
    // get the original activity guids, in order
    let activityGuids = optionsService.getActivities(plan).map(function(act) {
      return act.guid;
    });
    return serverService
      .createSchedulePlan(plan)
      .then(function(result) {
        return serverService.getSchedulePlan(result.guid);
      })
      .then(function(plan) {
        // get and iterate through the new activity GUIDs, add them to a map.
        optionsService.getActivities(plan).forEach(function(activity, i) {
          let oldGuid = activityGuids[i];
          activityGuidMap[oldGuid] = activity.guid;
        });
        return plan;
      });
  },
  afterPasteMethod: function(plan) {
    let schedules = optionsService.getSchedules(plan).filter(function(schedule) {
      return /^activity:/.test(schedule.eventId);
    });
    schedules.forEach(function(schedule) {
      let parts = schedule.eventId.split(":");
      if (activityGuidMap[parts[1]]) {
        parts[1] = activityGuidMap[parts[1]];
        schedule.eventId = parts.join(":");
      }
    });
    if (schedules.length > 0) {
      return serverService.saveSchedulePlan(plan);
    }
    return getSame(plan);
  }
};
MODEL_METADATA.Survey = {
  primaryKeys: ["guid"],
  label: "name",
  getMethod: function(survey) {
    return serverService.getSurvey(survey.guid, survey.createdOn);
  },
  pasteMethod: function(survey) {
    survey.identifier = sanitizeSurveyString(survey.identifier);
    scrubAllSurveyOptions(survey);
    survey.identifier = incrementCopyInteger(survey.identifier);

    let originalGUID = survey.guid;
    let activities = findAllSchedulePlanActivities();

    return serverService
      .createSurvey(survey)
      .then(function(response) {
        return serverService.publishSurvey(response.guid, response.createdOn);
      })
      .then(function(response) {
        activityGuidMap[originalGUID] = response.guid; // add new survey to map.
        activities
          .filter(function(activity) {
            return activity.survey && activity.survey.guid === originalGUID;
          })
          .forEach(function(activity) {
            activity.survey.guid = response.guid;
            activity.survey.createdOn = response.createdOn;
          });
        return response;
      });
    function findAllSchedulePlanActivities() {
      return clipboardEntries().reduce(function(array, model) {
        if (model.type === "SchedulePlan") {
          let acts = optionsService.getActivities(model);
          return array.concat(acts);
        }
        return array;
      }, []);
    }
    function incrementCopyInteger(value) {
      if (/-[0-9]+$/.test(value)) {
        let int = Math.abs(parseInt(value.match(/-[0-9]+$/), 10));
        return value + "-" + (++int);
      }
      return value + "-1";
    }
    function scrubAllSurveyOptions(survey) {
      survey.elements.forEach(function(element) {
        element.identifier = sanitizeSurveyString(element.identifier);
        if (element.constraints && element.constraints.enumeration) {
          element.constraints.enumeration.forEach(sanitizeOption);
        }
      });
    }
    function sanitizeOption(option) {
      let string = option.value || option.label;
      option.value = sanitizeSurveyString(string);
    }
    function sanitizeSurveyString(string) {
      // reduce multi sequence non-alphanumeric sequences to one
      string = string.replace(/[^a-zA-Z0-9]{2,}/g, function() {
        return arguments[0].trim().charAt(0);
      });
      // strip out non-alphanumeric characters from beginning and end
      string = string.replace(/^[^a-zA-Z0-9]*([\sa-zA-Z0-9_-]*)[^a-zA-Z0-9]*$/g, function() {
        return arguments[1];
      });
      // strip out all remaining illegal characters.
      string = string.replace(/[^\sa-zA-Z0-9_-]*/g, "");
      if (RESERVED_WORDS.indexOf(string) > -1) {
        string += "-id";
      }
      return string;
    }
  }
};
MODEL_METADATA.TaskReference = {
  primaryKeys: ["identifier"],
  label: "label",
  pasteMethod: function(task) {
    return serverService.getStudy().then(function(study) {
      study.taskIdentifiers.push(task.identifier);
      return serverService.saveStudy(study, false);
    });
  }
};
MODEL_METADATA.StudyConsent = {
  primaryKeys: ["subpopulationGuid", "createdOn"],
  label: "label",
  pasteMethod: function(consent) {
    return serverService.saveStudyConsent(consent.subpopulationGuid, consent).then(function(response) {
      return serverService.publishStudyConsent(response.subpopulationGuid, response.createdOn);
    });
  }
};
MODEL_METADATA.NotificationTopic = {
  primaryKeys: ["guid"],
  label: "name",
  pasteMethod: serverService.createTopic
};
// Not really an entity, but given this form: {"value":"theValue","type":"DataGroup"}
MODEL_METADATA.DataGroup = {
  primaryKeys: ["value"],
  label: "label",
  pasteMethod: function(dataGroup) {
    return serverService.getStudy().then(function(study) {
      study.dataGroups.push(dataGroup.value);
      return serverService.saveStudy(study, false);
    });
  }
};
MODEL_METADATA.CompoundActivityDefinition = {
  primaryKeys: ["taskId"],
  label: "taskId",
  copyMethod: function(task) {
    Promise.map(task.schemaList, function(schemaRef) {
      let p = schemaRef.revision ? 
        serverService.getUploadSchema(schemaRef.id, schemaRef.revision) : 
        serverService.getMostRecentUploadSchema(schemaRef.id);
      return p.then(function(schema) {
        clipboard.copy("UploadSchema", schema);
      });
    });
    Promise.map(task.surveyList, function(surveyRef) {
      let p = surveyRef.createdOn ? 
        serverService.getSurvey(surveyRef.guid, surveyRef.createdOn) : 
        serverService.getMostRecentlyPublishedSurvey(surveyRef.guid);
      return p.then(function(survey) {
        clipboard.copy("Survey", survey);
      });
    });
    return task;
  },
  pasteMethod: function(task) {
    delete task.version;
    task.surveyList.forEach(function(surveyRef) {
      surveyRef.guid = activityGuidMap[surveyRef.guid];
      delete surveyRef.createdOn;
    });
    task.schemaList.forEach(function(schemaRef) {
      delete schemaRef.revision;
    });
    return serverService.createTaskDefinition(task);
  }
};

function entriesAreEqual(entry1, entry2) {
  if (entry1.type !== entry2.type) {
    return false;
  }
  let primaryKeys = MODEL_METADATA[entry1.type].primaryKeys;
  return primaryKeys.every(function(primaryKey) {
    return entry1[primaryKey] === entry2[primaryKey];
  });
}
function entryExists(entry2) {
  return clipboardEntries().some(function(entry1) {
    return entriesAreEqual(entry1, entry2);
  });
}
function clipboardEntriesByDependencies() {
  return DEPENDENCY_ORDER.reduce(function(array, type) {
    let entries = clipboardEntries().filter(function(model) {
      return model.type === type;
    });
    return array.concat(entries);
  }, []);
}
function pasteItem(model) {
  let pasteMethod = MODEL_METADATA[model.type].pasteMethod;
  let afterPasteMethod = MODEL_METADATA[model.type].afterPasteMethod || getSame;

  return pasteMethod(model)
    .then(afterPasteMethod)
    .then(function(response) {
      clipboardEntries.remove(model);
      storeService.set("clipboard", clipboardEntries());
      return response;
    })
    .catch(utils.failureHandler());
}
function copyDataGroupToClipboard(dataGroup) {
  clipboard.copy("DataGroup", {
    value: dataGroup,
    label: "Data group: " + dataGroup,
    type: "DataGroup"
  });
}
function notifyListOfUpdate(response) {
  ko.postbox.publish("list-updated");
  return response;
}
function copyToClipboard(response) {
  response._label = response[MODEL_METADATA[response.type].label];
  clipboardEntries.push(response);
  storeService.set("clipboard", clipboardEntries());
}

serverService.addSessionStartListener(function() {
  let items = storeService.get("clipboard");
  if (items) {
    clipboardEntries.push.apply(clipboardEntries, items);
  }
});

serverService.addSessionEndListener(function() {
  storeService.set("clipboard", clipboardEntries());
  clipboardEntries([]);
});

let activityGuidMap = {};
let clipboard = {
  entries: clipboardEntries,
  copy: function(type, model) {
    if (!entryExists(model)) {
      let getMethod = MODEL_METADATA[type].getMethod || getSame;
      let copyMethod = MODEL_METADATA[type].copyMethod || getSame;
      getMethod(model)
        .then(copyMethod)
        .then(copyToClipboard);
    }
  },
  pasteAll: function(vm, event) {
    utils.startHandler(vm, event);

    activityGuidMap = {};
    Promise.mapSeries(clipboardEntriesByDependencies(), pasteItem)
      .then(notifyListOfUpdate)
      .then(utils.successHandler(vm, event, "Items copied."))
      .catch(utils.failureHandler());
  },
  clearAll: function() {
    activityGuidMap = {};
    clipboardEntries([]);
    storeService.set("clipboard", []);
  }
};

export default clipboard;
