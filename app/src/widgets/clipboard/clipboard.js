var serverService = require('../../services/server_service');
var storeService = require('../../services/store_service');
var ko = require('knockout');
var utils = require('../../utils');
var Promise = require('bluebird');
require('knockout-postbox');

/**
 * There are a lot of rules for the clipboard:
 * 
 * - to simplify dependency tracking, you can add in piecemeal, but must copy or remove all items from the clipboard.
 * 
 * - when copying, depending on the type, we'll add dependencies to the clipboard. They are:
 *      - subpopulations, also add published study consent
 *      - schedules, add task identifiers and surveys
 * 
 * - when copying surveys, we keep a record of their new guid/createdOn keys in the new study
 * 
 * - also when copying surveys, you're copying the most recently published, for the moment.
 * 
 * - when copying schedules, we publish any surveys that are referenced in the schedule
 * 
 * - when pasting, we work in a specific order: add task identifiers, surveys, schedules, subpopulations, 
 *  and then the study consent for that subpopulation.
 */
var clipboardEntries = ko.observableArray();

var noopGetMethod = function(item) {
    return Promise.resolve(JSON.parse(JSON.stringify(item)));
};

var MODEL_METADATA = {
    "schema": {
        primaryKeys:["schemaId", "revision"],
        label: "name",
        getMethod: noopGetMethod,
        createMethod: function(item) { return serverService.createUploadSchema(item); }
    },
    // Should be able to copy these, but not super useful because the study consent won't follow
    "consent group": {
        primaryKeys:["guid"],
        label: "name",
        getMethod: noopGetMethod,
        createMethod: function(item) { return serverService.createSubpopulation(item); }
    },
    // Not clear you can copy these. They depend on things like surveys which have specific creation dates.
    "schedule": {
        primaryKeys:["guid"],
        label: "label",
        getMethod: noopGetMethod,
        createMethod: function(item) { return serverService.createSchedulePlan(item); }
    },
    // These copy correctly
    "survey": {
        primaryKeys:["guid","createdOn"],
        label: "name",
        getMethod: function(item) { return serverService.getSurvey(item.guid, item.createdOn); },
        createMethod: function(item) { return serverService.createSurvey(item); }
    }
};

function entriesAreEqual(entry1, entry2) {
    if (entry1.type !== entry2.type) {
        return false;
    }
    var primaryKeys = MODEL_METADATA[entry1.type].primaryKeys;
    return primaryKeys.every(function(primaryKey) {
        return (entry1.model[primaryKey] === entry2.model[primaryKey]);
    });
}
function entryExists(entry2) {
    return clipboardEntries().some(function(entry1) {
        return entriesAreEqual(entry1, entry2);
    });
}
function pasteItem(item) {
    var nameField = MODEL_METADATA[item.type].label;
    item.model[nameField] += " (Copy)";
    return MODEL_METADATA[item.type].createMethod(item.model).then(function(response) {
        ko.postbox.publish(item.type+"-created", item.model);
        clipboardEntries.remove(item);
        return response;
    }).catch(utils.listFailureHandler());
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

module.exports = {
    entries: clipboardEntries,
    copy: function(type, model) {
        var entry = { type: type, model: model,
            label: model[MODEL_METADATA[type].label] };

        if (!entryExists(entry)) {
            MODEL_METADATA[type].getMethod(model).then(function(response) {
                entry.model = response;
                clipboardEntries.push(entry);
                storeService.set('clipboard', clipboardEntries());
            });
        }
    },
    paste: pasteItem,
    pasteAll: function(vm, event) {
        utils.startHandler(vm, event);
        Promise.mapSeries(clipboardEntries(), pasteItem)
            .then(utils.successHandler(vm, event, "Items copied."))
            .catch(utils.listFailureHandler());
    },
    cut: function(item) {
        clipboardEntries.remove(item);
        storeService.set('clipboard', clipboardEntries());
    }
};
