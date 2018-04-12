import {ServerService} from '../../services/server_service';
import batchDialogUtils from '../../batch_dialog_utils';
import Binder from '../../binder';
import fn from '../../functions';
import Promise from 'bluebird';
import root from '../../root';
import saveAs from '../../../lib/filesaver.min.js';
import utils from '../../utils';

const serverService = new ServerService(false);
const PREMSG = "Only exporting accounts that ";
const FETCH_DELAY = 100;
const PAGE_SIZE = 100;
const FIELDS = Object.freeze(["firstName","lastName","email", "sharingScope", "status", "notifyByEmail", 
    "dataGroups", "languages", "roles", "id", "healthCode", "externalId", "createdOn", "consentHistories"]);
const FIELD_FORMATTERS = {
    'consentHistories': function(map) {
        return Object.keys(map).map(function(guid) {
            return map[guid].map(formatConsentRecords).join('; ');
        }).join('; ');
    },
    'notifyByEmail': function(value) {
        return (value+'').toLowerCase();
    }
};

let ATTRIBUTES = [];
let HEADERS = [];

function formatConsentRecords(record) {
    let aString = record.subpopulationGuid;
    aString += " consented=" + fn.formatDateTime(record.signedOn);
    if (record.withdrewOn) {
        aString += ", withdrew=" + fn.formatDateTime(record.withdrewOn);
    }
    return aString;
}

let CollectParticipantsWorker = function(params) {
    fn.copyProps(this, params, 'total', 'emailFilter', 'startTime', 'endTime');
    this.identifiers = [];
    let pages = [];
    let numPages = Math.floor(this.total/PAGE_SIZE);
    for (let i=0; i <= numPages; i++) {
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
        this.offsetBy = this.pageOffsets[0];
        return serverService
            .getParticipants(this.offsetBy, PAGE_SIZE, this.emailFilter, null, this.startTime, this.endTime)
            .then(this._success.bind(this));
    },
    _success: function(response) {
        this.pageOffsets.shift();
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
let FetchParticipantWorker = function(identifiers, canContactByEmail) {
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
        this.identifier = this.identifiers[0];
        return Promise.delay(FETCH_DELAY).then(() => {
            return serverService.getParticipant(this.identifier)
                .then(this._success.bind(this));
        });
    },
    _success: function(response) {
        this.identifiers.shift();
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
        let array = this.fields.map(function(field) {
            let formatter = this.formatters[field];
            let value = participant[field];
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
    let self = this;
    
    batchDialogUtils.initBatchDialog(self);
    fn.copyProps(self, fn, 'formatDateTime');
    self.close = fn.seq(self.cancel, root.closeDialog);

    serverService.getStudy().then(function(study) {
        ATTRIBUTES = Object.freeze([].concat(study.userProfileAttributes)); 
        HEADERS = Object.freeze([].concat(FIELDS).concat(ATTRIBUTES).join("\t"));
    });
    
    new Binder(self)
        .obs('enable')
        .obs('canContactByEmail', false)
        .obs('filterMessage[]', []);

    if (params.emailFilter) {
        self.filterMessageObs.push(PREMSG+"have email matching the string &ldquo;"+params.emailFilter+"&rdquo;");
    }
    if (params.startTime) {
        self.filterMessageObs.push(PREMSG+"were created on or after &ldquo;"+
            fn.formatDateTime(params.startTime)+"&rdquo;");
    }
    if (params.endTime) {
        self.filterMessageObs.push(PREMSG+"were created on or before &ldquo;"+
            fn.formatDateTime(params.endTime)+"&rdquo;");
    }

    self.startExport = function(vm, event) {
        self.statusObs("Currently preparing your *.tsv file...");
        event.target.setAttribute("disabled","disabled");

        let collectWorker = new CollectParticipantsWorker(params);

        self.run(collectWorker).then(function(identifiers) {
            let fetchWorker = new FetchParticipantWorker(identifiers, self.canContactByEmailObs());
            let totalParticipants = identifiers.length;

            self.run(fetchWorker).then(function(output) {
                self.exportData = output;
                self.statusObs("Export finished. There were " + totalParticipants + 
                    " participants, and " + self.errorMessagesObs().length + " errors.");
                self.enableObs(true);
            });
        });
    };
    self.download = function() {
        let blob = new Blob([HEADERS+self.exportData], {
            type: "text/tab-separated-values;charset=utf-8"
        });
        let dateString = fn.formatDate();
        saveAs.saveAs(blob, "participants-"+dateString+".tsv");
    };
};
