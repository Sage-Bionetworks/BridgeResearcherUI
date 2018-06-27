import 'knockout-postbox';
import alerts from './widgets/alerts';
import clipboard from './widgets/clipboard/clipboard';
import ko from 'knockout';
import Promise from 'bluebird';
import root from './root';
import utils from './utils';
import swal from 'sweetalert2';

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
function prepareDelete(vm, objName, objPlural) {
    let deletables = vm.itemsObs().filter(hasBeenChecked);

    let msg = (deletables.length > 1) ?
            "Are you sure you want to delete these "+(objPlural || objName+"s")+"?" :
            "Are you sure you want to delete this "+objName+"?";
    let confirmMsg = (deletables.length > 1) ?
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
            vm.recordsMessageObs("There are currently no "+objName+"s.");
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
function redirectHandler(vm, redirect) {
    return function(request) {
        if (vm.itemsObs().length === 0 && !!redirect) {
            document.location = redirect;
        }
    };
}

/**
 * Set up a bunch of repetitive stuff for tables. This could be a component if data-driven tables
 * weren't a nightmare to turn into components. Better to take a mix-in approach.
 */
export default {
    /**
     * options:
     * - name: the name of the objects in the collection, in the ui
     * - type: the type of the objects in the collection
     * - delete: a function to call to delete individual items in the collection
     * - refresh: a function to call to refresh items in the collection 
     */
    prepareTable: function(vm, options) {
        let objName = options.name;
        let objPlural = options.plural;
        let objType = options.type;
        let deleteFunc = options.delete;
        let loadFunc = options.refresh;
        let redirectTo = options.redirect;

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
                let del = prepareDelete(vm, objName, objPlural);
                if (options.isAdmin && options.isAdmin()) {
                    swal({
                        type: 'warning',
                        text: del.msg, 
                        showCancelButton: true,
                        confirmButtonText:  'Delete',
                        cancelButtonText:  'Delete Permanently'
                    }).then(result => {
                        let f = (item) => deleteFunc(item, result.dismiss === "cancel");
                        utils.startHandler(self, event);
                        Promise.each(del.deletables, f)
                            .then(utils.successHandler(vm, event, del.confirmMsg))
                            .then(uncheckAll(vm))
                            .then(makeTableRowHandler(vm, del.deletables, objName))
                            .then(redirectHandler(vm, redirectTo))
                            .catch(utils.failureHandler());
                    });
                } else {
                    alerts.deleteConfirmation(del.msg, function() {
                        utils.startHandler(self, event);
                        Promise.each(del.deletables, deleteFunc)
                            .then(utils.successHandler(vm, event, del.confirmMsg))
                            .then(uncheckAll(vm))
                            .then(makeTableRowHandler(vm, del.deletables, objName))
                            .then(redirectHandler(vm, redirectTo))
                            .catch(utils.failureHandler());
                    });
                }
            };
        }
    },
    hasBeenChecked: function(item) {
        return item.checkedObs();
    },
    makeTableRowHandler: makeTableRowHandler
};