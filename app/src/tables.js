var ko = require('knockout');
var utils = require('./utils');
var Promise = require('bluebird');

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
function makeTableRowHandler(vm, deletables, rootPath, objName) {
    return function() {
        deletables.forEach(function(deletable) {
            vm.itemsObs.remove(deletable);
        });
        if (vm.itemsObs().length === 0) {
            // Yes both. There are cases where 'rootPath' is just the current page.
            document.querySelector(".loading_status").textContent = "There are currently no "+objName+".";
            document.location = rootPath;
        }
    };
}
function arrayListener(objName) {
    return function(array) {
        if (array.length) {
            return array.map(makeChecked);
        } else {
            document.querySelector(".loading_status").textContent = "There are currently no "+objName+"s.";
        }
    };
}

/**
 * Set up a bunch of repetitive stuff for tables. This could be a component if data-driven tables
 * weren't a nightmare to turn into components. Better to take a mix-in approach.
 */
module.exports = {
    prepareTable: function(vm, objName, upLink, deleteFunc) {
        vm.itemsObs = ko.observableArray([]);
        vm.itemsObs.subscribe(arrayListener(objName));

        vm.atLeastOneChecked = function () {
            return vm.itemsObs().some(hasBeenChecked);
        };
        vm.deleteItems = function(vm, event) {
            var del = prepareDelete(vm, objName);

            utils.deleteConfirmation(del.msg, function() {
                utils.startHandler(self, event);
                Promise.map(del.deletables, deleteFunc)
                    .then(makeTableRowHandler(vm, del.deletables, upLink, objName))
                    .then(utils.successHandler(vm, event, del.confirmMsg))
                    .catch(utils.failureHandler(vm, event));
            });
        };
    },
    hasBeenChecked: function(item) {
        return item.checkedObs();
    },
    makeTableRowHandler: makeTableRowHandler
};