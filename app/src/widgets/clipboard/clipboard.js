var serverService = require('../../services/server_service');
var storeService = require('../../services/store_service');
var ko = require('knockout');
var utils = require('../../utils');
var alerts = require('../../widgets/alerts');
var Promise = require('bluebird');
require('knockout-postbox');

/**
 * There are a lot of rules for the clipboard:
 * 
 * = to simplify dependency tracking, you can add in piecemeal, but must copy or remove all items from the clipboard.
 * 
 * = when copying, depending on the type, we'll add dependencies to the clipboard. They are:
 *      - subpopulations, also add published study consent
 *      - schedules, add task identifiers and surveys
 *      - subpopulations and schedule plans, add referenced data groups
 * 
 * - when creating surveys, we keep a record of their new guid/createdOn keys in the new study
 * 
 * = also when creating surveys, you're copying the most recently published, for the moment.
 * 
 * - when creating schedules, we first publish any surveys that are referenced in the schedule
 * 
 * - when pasting, we work in a specific order: add task identifiers, surveys, schedules, subpopulations, 
 *  and then the study consent for that subpopulation.
 * - when schedules are updated, then the labels for the scheduleplan don't have the labels
 */
var DEPENDENCY_ORDER = ['DataGroup','Subpopulation','StudyConsent','Survey','TaskReference','SchedulePlan','UploadSchema'];
var RESERVED_WORDS = ("access add all alter and any as asc audit between by char check cluster column column_value comment compress " +
    "connect create current date decimal default delete desc distinct drop else exclusive exists false file float for from " +
    "grant group having identified immediate in increment index initial insert integer intersect into is level like lock long" +
    "maxextents minus mlslabel mode modify nested_table_id noaudit nocompress not nowait null number of offline on online option" +
    "or order pctfree prior public raw rename resource revoke row row_id row_version rowid rownum rows select session set share " +
    "size smallint start successful synonym sysdate table then time to trigger true uid union unique update user validate values " +
    "varchar varchar2 view whenever where with").split(' ');

var clipboardEntries = ko.observableArray();

var MODEL_METADATA = {
    "UploadSchema": {
        primaryKeys:["schemaId", "revision"],
        label: "name",
        getMethod: getCopy,
        addDependents: getSame,
        createMethod: createUploadSchema
    },
    "Subpopulation": {
        primaryKeys:["guid"],
        label: "name",
        getMethod: getCopy,
        addDependents: subpopDependencies,
        createMethod: createSubpopulation
    },
    "SchedulePlan": {
        primaryKeys:["guid"],
        label: "label",
        getMethod: getCopy,
        addDependents: scheduleDependencies,
        createMethod: createSchedulePlan
    },
    "Survey": {
        primaryKeys:["guid"],
        label: "name",
        getMethod: getSurvey,
        addDependents: getSame,
        createMethod: createSurvey
    },
    "TaskReference": {
        primaryKeys:["identifier"],
        label: "label",
        getMethod: getSame,
        addDependents: getSame,
        createMethod: createTaskIdentifier
    },
    "StudyConsent": {
        primaryKeys: ["subpopulationGuid", "createdOn"],
        label: "label",
        getMethod: getSame,
        addDependents: getSame,
        createMethod: createStudyConsent
    },
    // Not really an entity, but given this form:
    // {"value":"theValue","type":"DataGroup"}
    "DataGroup": {
        primaryKeys: ["value"],
        label: "label",
        getMethod: getSame,
        addDependents: getSame,
        createMethod: createDataGroup
    }
};

function getCopy(model) {
    return Promise.resolve(JSON.parse(JSON.stringify(model)));
}
function getSame(model) {
    return Promise.resolve(model);
}
function getSurvey(model) { 
    return serverService.getSurvey(model.guid, model.createdOn);
}
function incrementCopyInteger(value) {
    if (/-[0-9]+$/.test(value)) {
        var int = Math.abs(parseInt(value.match(/-[0-9]+$/),10));
        return value + "-" + (++int);
    }
    return value + "-1";
}
function createUploadSchema(model) {
    return serverService.createUploadSchema(model);
}
function createSchedulePlan(model) { 
    return serverService.createSchedulePlan(model); 
}
function createStudyConsent(consent) {
    return serverService.saveStudyConsent(consent.subpopulationGuid, consent).then(function(response) {
        return serverService.publishStudyConsent(response.subpopulationGuid, response.createdOn);
    });
}
function createSubpopulation(subpop) {
    var studyConsent = clipboardEntries().filter(function(model) {
        return (model.type === "StudyConsent" && model.subpopulationGuid === subpop.guid);
    })[0];
    return serverService.createSubpopulation(subpop).then(function(response) {
        studyConsent.subpopulationGuid = response.guid;
        return response;
    });
}
function createTaskIdentifier(task) {
    return serverService.getStudy().then(function(study) {
        study.taskIdentifiers.push(task.identifier);
        return serverService.saveStudy(study, false);
    });
}
function createDataGroup(dataGroup) {
    return serverService.getStudy().then(function(study) {
        study.dataGroups.push(dataGroup.value);
        return serverService.saveStudy(study, false);
    });
}
function createSurvey(survey) {
    survey.identifier = sanitizeSurveyString(survey.identifier);
    scrubAllSurveyOptions(survey);
    survey.identifier = incrementCopyInteger(survey.identifier);

    var originalGUID = survey.guid;
    var activities = findAllSchedulePlanActivities();

    return serverService.createSurvey(survey).then(function(response) {
        return serverService.publishSurvey(response.guid, response.createdOn);
    }).then(function(response) {
        activities.forEach(function(activity) {
            if (activity.survey && activity.survey.guid === originalGUID) {
                activity.survey.guid = response.guid;
                activity.survey.createdOn = response.createdOn;
            }
        });
        return response;
    });
}

function entriesAreEqual(entry1, entry2) {
    if (entry1.type !== entry2.type) {
        return false;
    }
    var primaryKeys = MODEL_METADATA[entry1.type].primaryKeys;
    return primaryKeys.every(function(primaryKey) {
        return (entry1[primaryKey] === entry2[primaryKey]);
    });
}
function entryExists(entry2) {
    return clipboardEntries().some(function(entry1) {
        return entriesAreEqual(entry1, entry2);
    });
}
function clipboardEntriesByDependencies() {
    var entries = [];
    DEPENDENCY_ORDER.forEach(function(type) {
        clipboardEntries().forEach(function(model) {
            if (model.type === type) {
                entries.push(model);
            }
        });
    });
    return entries;
}
function pasteItem(model) {
    return MODEL_METADATA[model.type].createMethod(model).then(function(response) {
        clipboardEntries.remove(model);
        storeService.set('clipboard', clipboardEntries());
        return response;
    }).catch(utils.listFailureHandler());
}
function findAllSchedulePlanActivities() {
    return clipboardEntries().reduce(function(array, model) {
        if (model.type === "SchedulePlan") {
            var acts = findActivities(model);
            return array.concat(acts);
        }
        return array;
    }, []);
}
function findActivities(survey) {
    var strategy = survey.strategy;
    var allActivities = [];
    if (strategy.schedule) {
        allActivities = strategy.schedule.activities;
    }
    ["scheduleGroups","scheduleCriteria"].forEach(function(groupName) {
        if (strategy[groupName]) {
            strategy[groupName].forEach(function(group) {
                allActivities = allActivities.concat(group.schedule.activities);
            });
        }
    });
    return allActivities;
}
function findDataGroups(survey) {
    var dataGroups = {};
    if (survey.strategy.scheduleCriteria) {
        survey.strategy.scheduleCriteria.map(function(scheduleCriteria) {
            return scheduleCriteria.criteria;
        }).forEach(function(criteria) {
            criteria.allOfGroups.forEach(function(dg) { dataGroups[dg] = true; });
            criteria.noneOfGroups.forEach(function(dg) { dataGroups[dg] = true; });
        });
    }
    return Object.keys(dataGroups);
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
    var string = option.value || option.label;
    option.value = sanitizeSurveyString(string);
}
function sanitizeSurveyString(string) {
    // reduce multi sequence non-alphanumeric sequences to one
    string = string.replace(/[^a-zA-Z0-9]{2,}/g, function() { return arguments[0].trim().charAt(0); });
    // strip out non-alphanumeric characters from beginning and end
    string = string.replace(/^[^a-zA-Z0-9]*([\sa-zA-Z0-9_-]*)[^a-zA-Z0-9]*$/g, function() { return arguments[1]; });
    // strip out all remaining illegal characters.
    string = string.replace(/[^\sa-zA-Z0-9_-]*/g, '');
    if (RESERVED_WORDS.indexOf(string) > -1) {
        string += "-id";
    }
    return string;
}

function addDependents(model) {
    return MODEL_METADATA[model.type].addDependents(model);
}
function scheduleDependencies(model) {
    findDataGroups(model).forEach(function(dataGroup) {
        clipboard.copy("DataGroup", {
            value: dataGroup, 
            label: "Data group: " + dataGroup, 
            type:"DataGroup"
        });
    });
    findActivities(model).forEach(function(act) {
        if (act.task) {
            act.task.label = "Task ID for " + act.label;
            clipboard.copy("TaskReference", act.task);
        } else if (act.survey) {
            // this is missing when survey is published, we need it though for proper URL
            act.survey.createdOn = act.survey.createdOn || "published";
            MODEL_METADATA.Survey.getMethod(act.survey).then(function(response) {
                delete act.survey.createdOn;
                clipboard.copy("Survey", response);
            });
        }
    });
    return model;
}
function subpopDependencies(subpop) {
    return serverService.getStudyConsent(subpop.guid, subpop.publishedConsentCreatedOn).then(function(response) {
        response.label = "Consent for " + subpop.name;
        clipboard.copy("StudyConsent", response);
        return subpop;
    }).then(function(subpop) {
        if (subpop.criteria) {
            var dataGroups = subpop.criteria.allOfGroups.concat(subpop.criteria.noneOfGroups);
            dataGroups.forEach(copyDataGroupToClipboard);
        }
        return subpop;
    });
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
    storeService.set('clipboard', clipboardEntries());
}

serverService.addSessionStartListener(function() {
    var items = storeService.get('clipboard');
    if (items) {
        clipboardEntries.pushAll(items);
    }
});

serverService.addSessionEndListener(function() {
    storeService.set('clipboard', clipboardEntries());
    clipboardEntries([]);
});

var clipboard = {
    entries: clipboardEntries,
    copy: function(type, model) {
        if (!entryExists(model)) {
            MODEL_METADATA[type].getMethod(model)
                .then(addDependents)
                .then(copyToClipboard);
        }
    },
    pasteAll: function(vm, event) {
        utils.startHandler(vm, event);

        Promise.mapSeries(clipboardEntriesByDependencies(), pasteItem)
            .then(notifyListOfUpdate)
            .then(utils.successHandler(vm, event, "Items copied."))
            .catch(utils.listFailureHandler());
    },
    clearAll: function() {
        clipboardEntries([]);
        storeService.set('clipboard', []);
    }
};

module.exports = clipboard;
