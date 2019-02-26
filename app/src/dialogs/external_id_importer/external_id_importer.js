import { serverService } from "../../services/server_service";
import batchDialogUtils from "../../batch_dialog_utils";
import Binder from "../../binder";
import fn from "../../functions";
import Promise from "bluebird";
import root from "../../root";
import utils from "../../utils";

// Worker
// * calculateSteps: int
// * hasWork: boolean
// * performWork: Promise
// * workDescription: String, description what is processed by performWork
// * currentWorkItem: Object, the item just processed by performWork
// * postFetch: Promise: results of worker's sequential execution

function IdImportWorker(input, substudyId) {
  this.identifiers = input.split(/[,\s\t\r\n]+/).filter(function(value) {
    return value.length > 0;
  });
  this.substudyId = substudyId;
  this.importedIdentifiers = [];
}
IdImportWorker.prototype = {
  calculateSteps: function() {
    return this.identifiers.length;
  },
  hasWork: function() {
    return this.identifiers.length > 0;
  },
  workDescription: function() {
    return "Importing " + this.identifiers[0];
  },
  performWork: function() {
    this.currentId = this.identifiers.shift();
    return serverService
      .createExternalId({
        identifier: this.currentId,
        substudyId: this.substudyId
      })
      .then(this._success.bind(this));
  },
  _success: function(response) {
    this.importedIdentifiers.push(this.currentId);
  },
  currentWorkItem: function() {
    return this.currentId;
  },
  postFetch: function() {
    return Promise.resolve(this.importedIdentifiers);
  }
};

function CreateCredentialsWorker(supportEmail, identifiers, dataGroups, useLegacyFormat) {
  this.supportEmail = supportEmail;
  this.identifiers = identifiers;
  this.dataGroups = dataGroups;
  this.useLegacyFormat = useLegacyFormat;
}
CreateCredentialsWorker.prototype = {
  calculateSteps: function() {
    return this.identifiers.length;
  },
  hasWork: function() {
    return this.identifiers.length > 0;
  },
  workDescription: function() {
    return "Creating credentials for " + this.identifiers[0];
  },
  performWork: function() {
    this.currentId = this.identifiers.shift();
    let participant = this.useLegacyFormat ? 
      utils.oldCreateParticipantForID(this.supportEmail, this.currentId) : 
      utils.createParticipantForID(this.currentId);
    participant.dataGroups = this.dataGroups;
    return serverService.createParticipant(participant);
  },
  currentWorkItem: function() {
    return this.currentId;
  },
  postFetch: function() {
    Promise.resolve();
  }
};

module.exports = function(params) {
  let self = this;
  let supportEmail;

  batchDialogUtils.initBatchDialog(self);
  self.cancelDialog = fn.seq(self.cancel, params.reload, root.closeDialog);

  new Binder(self)
    .obs("import", "")
    .obs("enable", true)
    .obs("isDisabled", false)
    .obs("closeText", "Close")
    .obs("createCredentials", true)
    .obs("useLegacyFormat", false)
    .obs("dataGroups[]")
    .obs("allDataGroups[]")
    .obs("substudyId")
    .obs("substudyIds[]");

  self.statusObs("Please enter a list of identifiers, separated by commas or new lines.");
  self.createCredentialsObs.subscribe(function(newValue) {
    self.isDisabledObs(!newValue);
  });
  serverService
    .getStudy()
    .then(function(study) {
      let legacy = study.emailVerificationEnabled === false && study.externalIdValidationEnabled === true;
      self.useLegacyFormatObs(legacy);
      self.allDataGroupsObs(study.dataGroups);
      supportEmail = study.supportEmail;
    })
    .then(serverService.getSubstudies.bind(serverService))
    .then(response => {
      let opts = response.items.map(substudy => {
        return { value: substudy.id, label: substudy.name };
      });
      self.substudyIdsObs(opts);
    });

  function displayComplete() {
    self.statusObs("Import finished. There were " + self.errorMessagesObs().length + " errors.");
  }
  self.startImport = function(vm, event) {
    self.statusObs("Preparing to import...");

    let useLegacyFormat = self.useLegacyFormatObs();
    let importWorker = new IdImportWorker(self.importObs(), self.substudyIdObs());
    if (!importWorker.hasWork()) {
      self.errorMessagesObs.unshift("You must enter some identifiers.");
      return;
    } else {
      self.errorMessagesObs([]);
      self.enableObs(false);
    }

    self.run(importWorker).then(function(identifiers) {
      if (self.createCredentialsObs()) {
        let credentialsWorker = new CreateCredentialsWorker(
          supportEmail,
          identifiers,
          self.dataGroupsObs(),
          useLegacyFormat
        );
        self.run(credentialsWorker).then(displayComplete);
      } else {
        displayComplete();
      }
    });
  };
};
