import Binder from "../../binder";
import fn from "../../functions";
import ko from "knockout";
import Promise from "bluebird";
import root from "../../root";
import serverService from "../../services/server_service";
import utils from "../../utils";

export default function copySchemas(params) {
  let self = this;

  let copyables = params.copyables;
  let specs = [];

  new Binder(self)
    .obs("index", 0)
    .obs("name", copyables[0].name + " (Copy)")
    .obs("schemaId", copyables[0].schemaId)
    .obs("revision", 1);
  self.closeDialog = root.closeDialog;

  function updateObserversFromCopyables() {
    let index = self.indexObs();
    let name = /\(Copy\)$/.test(copyables[index].name) ? copyables[index].name : copyables[index].name + " (Copy)";
    self.nameObs(name);
    self.schemaIdObs(copyables[index].schemaId);
    self.revisionObs(1);
  }
  function updateSpecsFromObservers() {
    let index = self.indexObs();
    specs[index] = Object.assign({}, copyables[index], {
      name: self.nameObs(),
      schemaId: self.schemaIdObs(),
      revision: self.revisionObs()
    });
  }
  function updateObserversFromSpecs() {
    let index = self.indexObs();
    self.nameObs(specs[index].name);
    self.schemaIdObs(specs[index].schemaId);
    self.revisionObs(specs[index].revision);
  }
  function validValues() {
    return self.schemaIdObs() !== "" && parseInt(self.revisionObs()) > 0;
  }
  function changedValues() {
    var index = self.indexObs();
    return self.schemaIdObs() != copyables[index].schemaId || self.revisionObs() != 1;
  }

  self.canGoPreviousObs = ko.computed(function() {
    return self.indexObs() > 0;
  });
  self.canGoNextObs = ko.computed(function() {
    return validValues() && changedValues() && self.indexObs() < copyables.length - 1;
  });
  self.canCopyObs = ko.computed(function() {
    return validValues() && changedValues() && self.indexObs() === copyables.length - 1;
  });

  self.previous = function() {
    updateSpecsFromObservers();
    self.indexObs(self.indexObs() - 1);
    updateObserversFromSpecs();
  };
  self.next = function() {
    updateSpecsFromObservers();
    self.indexObs(self.indexObs() + 1);
    if (specs[self.indexObs()]) {
      updateObserversFromSpecs();
    } else {
      updateObserversFromCopyables();
    }
  };

  self.copy = function(vm, event) {
    updateSpecsFromObservers();
    utils.startHandler(vm, event);

    Promise.each(specs, fn.handlePromise(serverService.createUploadSchema.bind(serverService)))
      .then(params.closeCopySchemasDialog)
      .then(utils.successHandler(vm, event))
      .catch(utils.failureHandler());
  };
};
copySchemas.prototype.dispose = function() {
  this.canGoPreviousObs.dispose();
  this.canGoNextObs.dispose();
  this.canCopyObs.dispose();
};
