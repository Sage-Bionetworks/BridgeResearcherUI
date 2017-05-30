var saveAs = require('../../../lib/filesaver.min.js');
var serverService = require('../../services/server_service');
var root = require('../../root');
var fn = require('../../functions');
var Promise = require('bluebird');
var bind = require('../../binder');
var batchDialogUtils = require('../../batch_dialog_utils');

var PREMSG = "Only exporting accounts that ";
var FETCH_DELAY = 100;
var HEADERS = [];
var ATTRIBUTES = [];
var PAGE_SIZE = 100;
var FIELDS = Object.freeze(["firstName","lastName","email", "sharingScope", "status", "notifyByEmail", 
    "dataGroups", "languages", "roles", "id", "healthCode", "externalId", "createdOn", "consentHistories"]);
var FIELD_FORMATTERS = {
    'consentHistories': function(map) {
        return Object.keys(map).map(function(guid) {
            return map[guid].map(formatConsentRecords).join('; ');
        }).join('; ');
    },
    'notifyByEmail': function(value) {
        return (value+'').toLowerCase();
    }
};
function formatConsentRecords(record) {
    var aString = record.subpopulationGuid;
    aString += " consented=" + fn.formatDateTime(record.signedOn);
    if (record.withdrewOn) {
        aString += ", withdrew=" + fn.formatDateTime(record.withdrewOn);
    }
    return aString;
}

var CollectParticipantsWorker = function(params) {

    fn.copyProps(this, params, 'total', 'emailFilter', 'startDate', 'endDate');
    this.identifiers = [];
    var pages = [];
    var numPages = Math.floor(this.total/PAGE_SIZE);
    for (var i=0; i <= numPages; i++) {
        pages.push(i*PAGE_SIZE);
    }
    this.pageOffsets = pages;
};
CollectParticipantsWorker.prototype = {
    calculateSteps: function() {
        return this.pageOffsets.length;
    },
    hasWork: function() {
        return this.pageOffsets.length > 0;
    },
    workDescription: function() {
        return "Retrieving records " + this.pageOffsets[0] + " to " + (this.pageOffsets[0]+PAGE_SIZE);
    },
    currentWorkItem: function() {
        return this.offsetBy;
    },
    performWork: function(promise) {
        this.offsetBy = this.pageOffsets.shift();
        return serverService
            .getParticipants(this.offsetBy, PAGE_SIZE, this.emailFilter, this.startDate, this.endDate)
            .then(this._success.bind(this));
    },
    _success: function(response) {
        if (response && response.items) {
            response.items.forEach(function(participant) {
                if (participant.status !== "unverified") {
                    this.identifiers.push(participant.id);
                }
            }, this);
        }
        return Promise.resolve();
    },
    postFetch: function() {
        return Promise.resolve(this.identifiers);
    }
};
var FetchParticipantWorker = function(identifiers, canContactByEmail) {
    this.identifiers = identifiers;
    this.canContactByEmail = canContactByEmail;
    this.fields = FIELDS;
    this.attributes = ATTRIBUTES;
    this.formatters = FIELD_FORMATTERS;
    this.output = "";
};
FetchParticipantWorker.prototype = {
    calculateSteps: function() {
        return this.identifiers.length;
    },
    hasWork: function() {
        return this.identifiers.length > 0;
    },
    workDescription: function() {
        return "Retrieving participant " + this.identifiers[0];
    },
    currentWorkItem: function() {
        return this.identifier;
    },
    performWork: function() {
        if (!this.hasWork()) {
            return Promise.resolve();
        }
        this.identifier = this.identifiers.shift();
        return Promise.delay(FETCH_DELAY).then(function() {
            return serverService.getParticipant(this.identifier).then(this._success.bind(this));
        }.bind(this));
    },
    _success: function(response) {
        if (this._canExport(response)) {
            this.output += "\n"+this._formatOneParticipant(response);
        }
        return Promise.resolve();
    },
    _canExport: function(participant) {
        return participant &&
            participant.status === "enabled" && 
            participant.email && 
            (!this.canContactByEmail || this._canContact(participant));
    },
    _canContact: function(participant) {
        return participant.notifyByEmail === true &&
            participant.sharingScope !== "no_sharing" &&
            utils.atLeastOneSignedConsent(participant.consentHistories);
    },
    _formatOneParticipant: function(participant) {
        var array = this.fields.map(function(field) {
            var formatter = this.formatters[field];
            var value = participant[field];
            return (formatter) ? formatter(value) : value;
        }, this);
        this.attributes.forEach(function(field) {
            array.push(participant.attributes[field]);
        });
        return array.join("\t");
    },
    postFetch: function() {
        return Promise.resolve(this.output);
    }
};

module.exports = function(params) {
    var self = this;
    
    batchDialogUtils.initBatchDialog(self);
    fn.copyProps(self, fn, 'formatDateTime');
    self.close = fn.seq(self.cancel, root.closeDialog);

    serverService.getStudy().then(function(study) {
        ATTRIBUTES = Object.freeze([].concat(study.userProfileAttributes)); 
        HEADERS = Object.freeze([].concat(FIELDS).concat(ATTRIBUTES).join("\t"));
    });
    
    bind(self)
        .obs('enable')
        .obs('canContactByEmail', false)
        .obs('filterMessage[]', []);

    if (params.emailFilter) {
        self.filterMessageObs.push(PREMSG+"have email matching the string &ldquo;"+params.emailFilter+"&rdquo;");
    }
    if (params.startDate) {
        self.filterMessageObs.push(PREMSG+"were created on or after &ldquo;"+
            new Date(params.startDate).toLocaleDateString()+"&rdquo;");
    }
    if (params.endDate) {
        self.filterMessageObs.push(PREMSG+"were created on or before &ldquo;"+
            new Date(params.endDate).toLocaleDateString()+"&rdquo;");
    }

    self.startExport = function(vm, event) {
        self.statusObs("Currently preparing your *.tsv file...");
        event.target.setAttribute("disabled","disabled");

        var collectWorker = new CollectParticipantsWorker(params);

        self.run(collectWorker).then(function(identifiers) {
            var fetchWorker = new FetchParticipantWorker(identifiers, self.canContactByEmailObs());
            var totalParticipants = identifiers.length;

            self.run(fetchWorker).then(function(output) {
                self.exportData = output;
                self.statusObs("Export finished. There were " + totalParticipants + 
                    " participants, and " + self.errorMessagesObs().length + " errors.");
                self.enableObs(true);
            });
        });
    };
    self.download = function() {
        var blob = new Blob([HEADERS+self.exportData], {
            type: "text/tab-separated-values;charset=utf-8"
        });
        var dateString = new Date().toISOString().split("T")[0];  
        saveAs.saveAs(blob, "participants-"+dateString+".tsv");
    };
};
