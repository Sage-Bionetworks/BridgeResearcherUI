var root = require('../../root');
var utils = require('../../utils');
var bind = require('../../binder');
var serverService = require('../../services/server_service');
var Promise = require("bluebird");
var batchDialogUtils = require('../../batch_dialog_utils');
var fn = require('../../functions');

// Worker
// * calculateSteps: int
// * hasWork: boolean
// * performWork: Promise
// * workDescription: String, description what is processed by performWork
// * currentWorkItem: Object, the item just processed by performWork
// * postFetch: Promise: results of worker's sequential execution

function IdImportWorker(input) {
    this.identifiers = input.split(/[,\s\t\r\n]+/).filter(function(value) {
        return value.length > 0;
    });
    this.importedIdentifiers = [];
}
IdImportWorker.prototype = {
    calculateSteps: function(){ 
        return this.identifiers.length;
    },
    hasWork: function(){ 
        return this.identifiers.length > 0;
    },
    workDescription: function() { 
        return "Importing " + this.identifiers[0];
    },
    performWork: function(){ 
        this.currentId = this.identifiers.shift();
        return serverService.addExternalIds([this.currentId]).then(this._success.bind(this));
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

function CreateCredentialsWorker(supportEmail, identifiers) {
    this.supportEmail = supportEmail;
    this.identifiers = identifiers;
}
CreateCredentialsWorker.prototype = {
    calculateSteps: function(){ 
        return this.identifiers.length;
    },
    hasWork: function(){ 
        return this.identifiers.length > 0;
    },
    workDescription: function() { 
        return "Creating credentials for " + this.identifiers[0];
    },
    performWork: function(){ 
        this.currentId = this.identifiers.shift();
        var participant = utils.createParticipantForID(this.supportEmail, this.currentId);
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
    var self = this;
    var supportEmail;

    batchDialogUtils.initBatchDialog(self);
    self.cancelDialog = fn.seq(self.cancel, params.reload, root.closeDialog);

    bind(self)
        .obs('import', '')
        .obs('enable', true)
        .obs('closeText', 'Close')
        .obs('createCredentials', !root.isPublicObs());

    self.statusObs("Please enter a list of identifiers, separated by commas or new lines.");
    
    serverService.getStudy().then(function(study) {
        supportEmail = study.supportEmail;
    });
    
    function displayComplete() {
        self.statusObs("Import finished. There were " + self.errorMessagesObs().length + " errors.");
    }
    self.startImport = function(vm, event) {
        self.statusObs("Preparing to import...");

        var importWorker = new IdImportWorker(self.importObs());
        if (!importWorker.hasWork()) {
            self.errorMessagesObs.unshift("You must enter some identifiers.");
            return;
        } else {
            self.errorMessagesObs([]);
            self.enableObs(false);
        }

        self.run(importWorker).then(function(identifiers) {
            if (self.createCredentialsObs()) {
                var credentialsWorker = new CreateCredentialsWorker(supportEmail, identifiers);
                self.run(credentialsWorker).then(displayComplete);
            } else {
                displayComplete();
            }
        });
    };
};