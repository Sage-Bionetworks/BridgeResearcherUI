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
    this.currentCredentialPair.studyId = this.studyId;
    return serverService.createExternalId(this.currentCredentialPair)
      .then(this._success.bind(this));
  },
  _success: function(response) {
    this.importedCredentialPairs.push(this.currentCredentialPair);
  },
  currentWorkItem: function() {
    return this.currentCredentialPair;
  },
  postFetch: function() {
    return Promise.resolve(this.importedCredentialPairs);
  }
};

function CreateCredentialsWorker(supportEmail, credentialPairs, dataGroups) {
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
    return serverService.createParticipant(this.credentialPair);
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
    .obs("isDisabled", false)
    .obs("closeText", "Close")
    .obs("createCredentials", true)
    .obs("dataGroups[]")
    .obs("allDataGroups[]")
    .obs("studyId")
    .obs("studyIds[]");

  self.statusObs('');
  self.createCredentialsObs.subscribe(function(newValue) {
    self.isDisabledObs(!newValue);
  });
  serverService.getApp()
    .then(function(app) {
      self.allDataGroupsObs(app.dataGroups);
      self.app = app;
      supportEmail = app.supportEmail;
      self.statusObs("Please enter a list of identifiers, separated by commas or new lines. If you wish to include passwords, use the format <code>externalid=password</code> (again these can be separated by commas or new lines). <em>" + password.passwordPolicyDescription(self.app.passwordPolicy) + "</em>");
    })
    .then(serverService.getStudies.bind(serverService))
    .then(response => {
      let opts = response.items.map(study => {
        return { value: study.id, label: study.name };
      });
      self.studyIdsObs(opts);
    });

  function displayComplete() {
    self.statusObs("Import finished. There were " + self.errorMessagesObs().length + " errors.");
  }
  self.startImport = function(vm, event) {
    self.errorMessagesObs([]);
    self.statusObs("Preparing to import...");

    let importWorker = new IdImportWorker(self.app, self.importObs(), self.studyIdObs());
    if (!importWorker.hasWork()) {
      self.errorMessagesObs.unshift("You must enter some identifiers.");
      return;
    } else {
      self.errorMessagesObs([]);
      self.enableObs(false);
    }

    self.run(importWorker).then(function(identifiers) {
      if (self.createCredentialsObs() && identifiers.length) {
        let credentialsWorker = new CreateCredentialsWorker(
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
