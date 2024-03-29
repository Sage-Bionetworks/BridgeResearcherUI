import alerts from "./widgets/alerts";
import ko from "knockout";
import Promise from "bluebird";
import root from "./root";
import utils from "./utils";

// TODO: An updateTables call of some kind that can isolate the name of the 
// collection
// TODO: A way 

const LOADER_TEXT = "<span class='ui tiny active inline loader'></span>";

function hasBeenChecked(item) {
  return item.checkedObs() && (!item.deletedObs || !item.deletedObs());
}
function makeChecked(item) {
  if (typeof item.checkedObs === "undefined") {
    item.checkedObs = ko.observable(false);
    item.deletedObs = ko.observable(item.deleted || false);
  }
  return item;
}
function titleCase(string) {
  return string.substring(0, 1).toUpperCase() + string.substring(1);
}
function prepareDelete(vm, objName, objPlural) {
  let deletables = vm.itemsObs().filter(hasBeenChecked);

  let msg = deletables.length > 1 ? 
    "Are you sure you want to delete these " + (objPlural || objName + "s") + "?" : 
    "Are you sure you want to delete this " + objName + "?";
  let confirmMsg = deletables.length > 1 ? titleCase(objName) + "s deleted." : titleCase(objName) + " deleted.";
  return { deletables: deletables, msg: msg, confirmMsg: confirmMsg };
}
function makeTableRowHandler(vm, deletables, objName) {
  return function() {
    deletables.forEach(function(deletable) {
      vm.itemsObs.remove(deletable);
      vm.recordsMessageObs("");
    });
    if (vm.itemsObs().length === 0) {
      vm.recordsMessageObs("<p>There are currently no " + objName + "s.</p>");
    }
  };
}
function arrayListener(recordsMessageObs, objName) {
  return function(array) {
    if (array.length) {
      return array.map(makeChecked);
    } else {
      recordsMessageObs("<p>There are currently no " + objName + ".</p>");
    }
  };
}
function uncheckAll(vm) {
  return () => vm.checkAllObs(false);
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
    // TODO: Know what's confusing? Renaming all the options like this
    let id = options.id;
    let objName = options.name;
    let objPlural = options.plural;
    let deleteFunc = options.delete;
    let deletePermanentlyFunc = options.deletePermanently;
    let loadFunc = options.refresh;
    let redirectTo = options.redirect;
    let undeleteFunc = options.undelete;
    let publishFunc = options.publish;
    let seekButton = (options.deletePermanently) ? "button" : null;

    if (!vm.itemsObs) {
      vm.itemsObs = ko.observableArray([]);
    }
    vm.recordsMessageObs = ko.observable(LOADER_TEXT);
    vm.itemsObs.subscribe(arrayListener(vm.recordsMessageObs, objPlural || objName + "s"));
    vm.atLeastOneChecked = () => vm.itemsObs().some(hasBeenChecked);

    // Control on left side of header row that checks/unchecks all boxes on the page.
    vm.checkAllObs = ko.observable();
    vm.checkAllObs.subscribe(function(newValue) {
      vm.itemsObs().map((item) => item.checkedObs(newValue));
    });

    if (loadFunc) {
      ko.postbox.subscribe("list-updated", loadFunc);
    }
    if (deleteFunc) {
      vm.deleteItems = function(vm, event) {
        let del = prepareDelete(this, objName, objPlural);
        alerts.deleteConfirmation(del.msg, () => {
          utils.startHandler(this, event, seekButton);
          Promise.each(del.deletables, deleteFunc)
            .then(uncheckAll(this))
            .then(loadFunc)
            .then(utils.successHandler(this, event, del.confirmMsg))
            .then(redirectHandler(this, redirectTo))
            .catch(utils.failureHandler({ id }));
        });
      }.bind(vm);
    }
    if (deletePermanentlyFunc) {
      vm.deletePermanently = function(vm, event) {
        let del = prepareDelete(this, objName, objPlural);
        let msg = del.msg + " We cannot undo this kind of delete. Are you in production? Maybe rethink this.";
        alerts.deleteConfirmation(msg, () => {
          utils.startHandler(this, event, seekButton);
          Promise.each(del.deletables, deletePermanentlyFunc)
            .then(utils.successHandler(this, event, del.confirmMsg))
            .then(uncheckAll(this))
            .then(loadFunc)
            .then(redirectHandler(this, redirectTo))
            .catch(utils.failureHandler({ id }));
        }, "Delete FOREVER");
      }.bind(vm);
    }
    if (publishFunc) {
      vm.publish = function(vm, event) {
        let items = vm.itemsObs().filter(hasBeenChecked);
    
        utils.startHandler(vm, event);
        Promise.each(items, publishFunc)
          .then(utils.successHandler(vm, event, "The selected resources have been published."))
          .catch(utils.failureHandler({ id, redirect: false }));
      }
    }
    if (undeleteFunc && loadFunc) {
      vm.isAdmin = root.isAdmin;
      vm.showDeletedObs = ko.observable(false);
      vm.showDeletedObs.subscribe(() => {
        vm.itemsObs([]);
        vm.recordsMessageObs(LOADER_TEXT);
        setTimeout(loadFunc, 200);
      });
      vm.undelete = function(item, event) {
        item.deleted = false;

        event.target.parentNode.innerHTML = LOADER_TEXT;
        return undeleteFunc(item).then(loadFunc)
          .then(utils.successHandler(vm, event, titleCase(objName) + " has been restored."))
          .catch(utils.failureHandler({ id }));
      };
    }
  },
  hasBeenChecked: (item) => item.checkedObs(),
  makeTableRowHandler: makeTableRowHandler
};
