var ko = require('knockout');
require('knockout-postbox');
var root = require('../../root');
var utils = require('../../utils');
var bind = require('../../binder');
var serverService = require('../../services/server_service');
var Promise = require("bluebird");

var SUBMISSION_SIZE = 5;
var SUBMISSION_DELAY = 1200;
var SPLIT_REGEX = /[,\s\t\r\n]+/;

function getPerc(step, max) {
    var perc = ((step/max)*100).toFixed(0);
    if (perc > 100) { perc = 100; }
    return perc + "%";
}
function createParticipantMaker(email) {
    return function(identifier) {
        return utils.createParticipantForID(email, identifier);
    };
}

module.exports = function(params) {
    var self = this;
    var cancel = false;
    
    var binder = bind(self)
        .obs('import', '')
        .obs('value', 0)
        .obs('max', 0)
        .obs('title', 'Import External Identifiers')
        .obs('percentage', '0%')
        .obs('selected', true)
        .obs('closeText', 'Close')
        .obs('autoCredentials', (typeof params.autoCredentials === "boolean") ? 
            params.autoCredentials : false)
        .obs('errorMessages[]', [])
        .obs('status', "Please enter a list of identifiers, separated by commas or new lines. ")
        .obs('createCredentials', false);
        
    if (self.autoCredentialsObs()) {
        self.titleObs("Import Lab Codes");
    }
    
    function startProgressMeter(max) {
        cancel = false;
        self.closeTextObs('Cancel');
        self.valueObs(0);
        self.maxObs(max);
        self.statusObs("Importing. This can take awhile.");
    }
    function tickMeter(response) {
        var step = self.valueObs()+1;
        self.valueObs(step);
        self.percentageObs(getPerc(step, self.maxObs()));
        return response;
    }
    function tickMeterError(response) {
        var msg = utils.mightyMessageFinder(response);
        tickMeter(response);
        self.errorMessagesObs.push(msg);
    }
    function endProgressMeter(actionElement) {
        return function(response) {
            var errorCount = self.errorMessagesObs().length;
            var errorMsg = (errorCount === 0) ? 
                "" : 
                (errorCount === 1) ? 
                    " There was an error." : 
                    (" There were "+errorCount+" errors.");
            actionElement.disabled = true;
            self.closeTextObs('Close');
            self.valueObs(self.maxObs());
            self.percentageObs("100%");
            self.statusObs("Identifiers imported." + errorMsg);
            return response;
        };
    }
    function initParticipantMaker(study) {
        self.createParticipant = createParticipantMaker(self.study.supportEmail);
    }
    function addIdentifier(promise, identifier, doCreateCredentials) {
        promise = promise.then(function() {
            if (cancel) { return; }
            return serverService.addExternalIds([identifier])
                .catch(tickMeterError);
        });
        if (doCreateCredentials) {
            serverService.getParticipants(0, 5, "+"+identifier+"@").then(function(response) {
                if (cancel) { return; }
                if (response.items.length === 0) {
                    return promise.then(function() {
                        var participant = self.createParticipant(identifier);
                        return serverService.createParticipant(participant)
                            .catch(tickMeterError);
                    });
                } else {
                    return Promise.resolve();
                }
            });
        }
        return promise.then(tickMeter, tickMeterError).delay(SUBMISSION_DELAY);
    }
 
    self.doImport = function(vm, event) {
        var identifiers = self.importObs().split(SPLIT_REGEX).filter(function(value) {
            return value.length > 0;
        });
        if (identifiers.length === 0) {
            utils.formFailure(event.target, 'You must enter some identifiers.');
            return;
        }
        var doCreateCredentials = self.createCredentialsObs() || self.autoCredentialsObs();

        utils.startHandler(vm, event);
        startProgressMeter(identifiers.length+1);

        var promise = Promise.resolve();
        while(identifiers.length) {
            promise = addIdentifier(promise, identifiers.shift(), doCreateCredentials);
        }
        promise.then(endProgressMeter(event.target))
            .then(utils.successHandler(vm, event))
            .catch(utils.dialogFailureHandler(vm, event));        
    };

    self.close = function(vm, event) {
        cancel = true;
        self.errorMessagesObs([]);
        root.closeDialog();
        ko.postbox.publish('external-ids-page-refresh');
    };
    
    serverService.getStudy()
        .then(binder.assign('study'))
        .then(initParticipantMaker);
};