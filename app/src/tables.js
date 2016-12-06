var ko = require('knockout');
var utils = require('./utils');
var alerts = require('./widgets/alerts');
var clipboard = require('./widgets/clipboard/clipboard');
var root = require('./root');
var Promise = require('bluebird');
require('knockout-postbox');

function hasBeenChecked(item) {
    return item.checkedObs();
}
function makeChecked(item) {
    if (typeof item.checkedObs === "undefined") {
        item.checkedObs = ko.observable(false);
    }
    return item;
}
function titleCase(string) {
    return string.substring(0,1).toUpperCase() + string.substring(1);
}
function prepareDelete(vm, objName) {
    var deletables = vm.itemsObs().filter(hasBeenChecked);
    var msg = (deletables.length > 1) ?
            "Are you sure you want to delete these "+objName+"s?" :
            "Are you sure you want to delete this "+objName+"?";
    var confirmMsg = (deletables.length > 1) ?
            titleCase(objName)+"s deleted." : titleCase(objName)+" deleted.";
    return {deletables: deletables, msg: msg, confirmMsg: confirmMsg};        
}
function makeTableRowHandler(vm, deletables, objName) {
    return function() {
        deletables.forEach(function(deletable) {
            vm.itemsObs.remove(deletable);
            vm.recordsMessageObs("");
        });
        if (vm.itemsObs().length === 0) {
            vm.recordsMessageObs("There are currently no "+objName+".");
        }
    };
}
function arrayListener(recordsMessageObs, objName) {
    return function(array) {
        if (array.length) {
            return array.map(makeChecked);
        } else {
            recordsMessageObs("There are currently no "+objName+"s.");
        }
    };
}
function uncheckAll(vm) {
    return function() {
        vm.checkAllObs(false);
    };
}

/**
 * Set up a bunch of repetitive stuff for tables. This could be a component if data-driven tables
 * weren't a nightmare to turn into components. Better to take a mix-in approach.
 */
module.exports = {
    /**
     * options:
     * - name: the name of the objects in the collection, in the ui
     * - type: the type of the objects in the collection
     * - delete: a function to call to delete individual items in the collection
     * - refresh: a function to call to refresh items in the collection 
     */
    prepareTable: function(vm, options) {
        var objName = options.name;
        var objType = options.type;
        var deleteFunc = options.delete;
        var loadFunc = options.refresh;

        if (!vm.itemsObs) {
            vm.itemsObs = ko.observableArray([]);
        }
        vm.recordsMessageObs = ko.observable("<div class='ui tiny active inline loader'></div>");
        vm.itemsObs.subscribe(arrayListener(vm.recordsMessageObs, objName));
        vm.atLeastOneChecked = function () {
            return vm.itemsObs().some(hasBeenChecked);
        };

        // Control on left side of header row that checks/unchecks all boxes on the page. 
        vm.checkAllObs = ko.observable();
        vm.checkAllObs.subscribe(function(newValue) {
            vm.itemsObs().map(function(item) {
                item.checkedObs(newValue);
            });
        });

        vm.copyToClipboard = function() {
            root.sidePanelObs('clipboard');
            vm.itemsObs().forEach(function(item) {
                if (item.checkedObs()) {
                    clipboard.copy(objType, item);
                    item.checkedObs(false);
                }
            });
        };
        if (loadFunc) {
            ko.postbox.subscribe("list-updated", loadFunc);
        }
        if (deleteFunc) {
            vm.deleteItems = function(vm, event) {
                var del = prepareDelete(vm, objName);

                alerts.deleteConfirmation(del.msg, function() {
                    utils.startHandler(self, event);
                    Promise.each(del.deletables, deleteFunc)
                        .then(makeTableRowHandler(vm, del.deletables, objName))
                        .then(utils.successHandler(vm, event, del.confirmMsg))
                        .then(uncheckAll(vm))
                        .catch(utils.failureHandler(vm, event));
                });
            };
        }
    },
    hasBeenChecked: function(item) {
        return item.checkedObs();
    },
    makeTableRowHandler: makeTableRowHandler
};