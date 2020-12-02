import batchDialogUtils from "../../batch_dialog_utils";
import Binder from "../../binder";
import fn from "../../functions";
import parser from "../../import_parser";
import password from "../../password_generator";
import Promise from "bluebird";
import root from "../../root";
import serverService from "../../services/server_service";

// Worker
// * calculateSteps: int
// * hasWork: boolean
// * performWork: Promise
// * workDescription: String, description what is processed by performWork
// * currentWorkItem: Object, the item just processed by performWork
// * postFetch: Promise: results of worker's sequential execution

function IdImportWorker(app, input, studyId) {
  this.app = app;
  this.credentialPairs = parser(input);
  this.studyId = studyId;
  this.importedCredentialPairs = [];
}
IdImportWorker.prototype = {
  calculateSteps: function() {
    return this.credentialPairs.length;
  },
  hasWork: function() {
    return this.credentialPairs.length > 0;
  },
  workDescription: function() {
    if (this.currentCredentialPair) {
      return "Importing " + this.currentCredentialPair.externalId;
    } else {
      return "";
    }
  },
  performWork: function() {
    this.currentCredentialPair = this.credentialPairs.shift();
    if (!password.isPasswordValid(this.app.passwordPolicy, this.currentCredentialPair.password)) {
      return Promise.reject(new Error("Password is invalid. " + password.passwordPolicyDescription(this.app.passwordPolicy)));
    }
    this.currentCredentialPair.externalIds = {};
    this.currentCredentialPair.externalIds[this.studyId] = this.currentCredentialPair.identifier;
    delete this.currentCredentialPair.identifier;
    this.importedCredentialPairs.push(this.currentCredentialPair);
    return Promise.resolve();
  },
  currentWorkItem: function() {
    return this.currentCredentialPair;
  },
  postFetch: function() {
    return Promise.resolve(this.importedCredentialPairs);
  }
};

function CreateCredentialsWorker(studyId, supportEmail, credentialPairs, dataGroups) {
  this.studyId = studyId;
  this.supportEmail = supportEmail;
  this.credentialPairs = credentialPairs;
  this.dataGroups = dataGroups;
}
CreateCredentialsWorker.prototype = {
  calculateSteps: function() {
    return this.credentialPairs.length;
  },
  hasWork: function() {
    return this.credentialPairs.length > 0;
  },
  workDescription: function() {
    return "Creating credentials for " + this.credentialPairs[0].externalId;
  },
  performWork: function() {
    this.credentialPair = this.credentialPairs.shift();
    this.credentialPair.dataGroups = this.dataGroups;
    return serverService.createStudyParticipant(this.studyId, this.credentialPair);
  },
  currentWorkItem: function() {
    return this.credentialPair;
  },
  postFetch: function() {
    Promise.resolve();
  }
};

export default function(params) {
  let self = this;
  let supportEmail;

  batchDialogUtils.initBatchDialog(self);
  self.cancelDialog = fn.seq(self.cancel, params.reload, root.closeDialog);

  new Binder(self)
    .obs("import", "")
    .obs("enable", true)
    .obs("closeText", "Close")
    .obs("dataGroups[]")
    .obs("allDataGroups[]");

  self.statusObs('');
  serverService.getApp().then(function(app) {
    self.allDataGroupsObs(app.dataGroups);
    self.app = app;
    supportEmail = app.supportEmail;
    self.statusObs("Please enter a list of identifiers, separated by commas or new lines. If you wish to include passwords, use the format <code>externalid=password</code> (again these can be separated by commas or new lines). <em>" + password.passwordPolicyDescription(self.app.passwordPolicy) + "</em>");
  });

  function displayComplete() {
    self.statusObs("Import finished. There were " + self.errorMessagesObs().length + " errors.");
  }
  self.startImport = function(vm, event) {
    self.errorMessagesObs([]);
    self.statusObs("Preparing to import...");

    let importWorker = new IdImportWorker(self.app, self.importObs(), params.studyId);
    if (!importWorker.hasWork()) {
      self.errorMessagesObs.unshift("You must enter some identifiers.");
      return;
    } else {
      self.errorMessagesObs([]);
      self.enableObs(false);
    }

    self.run(importWorker).then(function(identifiers) {
      if (identifiers.length) {
        let credentialsWorker = new CreateCredentialsWorker(
          params.studyId,
          supportEmail,
          identifiers,
          self.dataGroupsObs()
        );
        self.run(credentialsWorker).then(displayComplete);
      } else {
        displayComplete();
      }
    });
  };
};