var ko = require('knockout');
var saveAs = require('../../../lib/filesaver.min.js');
var serverService = require('../../services/server_service');
var root = require('../../root');
var utils = require('../../utils');

var HEADERS = [];
var ATTRIBUTES = [];
var PAGING_TIMEOUT = 2500;
var TIMEOUT = 1500;
var PAGE_SIZE = 100;
var FIELDS = Object.freeze(["firstName","lastName","email", "sharingScope", "status", "notifyByEmail", 
    "dataGroups", "languages", "roles", "id", "healthCode", "createdOn", "consentHistories"]);
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
    aString += " consented=" + utils.formatDateTime(record.signedOn);
    if (record.withdrewOn) {
        aString += ", withdrew=" + utils.formatDateTime(record.withdrewOn);
    }
    return aString;
}
function getPageOffsets(numPages) {
    var pages = [];
    for (var i=0; i <= numPages; i++) {
        pages.push(i*PAGE_SIZE);
    }
    return pages;
}
function canExport(participant, canContactByEmail) {
    return participant &&
           participant.status === "enabled" && 
           participant.email && 
           (!canContactByEmail || canContact(participant));
}
function canContact(participant) {
    return participant.notifyByEmail === true &&
           participant.sharingScope !== "no_sharing" &&
           utils.atLeastOneSignedConsent(participant.consentHistories);
}

module.exports = function(params) {
    var self = this;
    
    serverService.getStudy().then(function(study) {
        study.userProfileAttributes.forEach(function(attr) {
            ATTRIBUTES.push(attr);
        });
        Object.freeze(ATTRIBUTES);
        HEADERS = Object.freeze([].concat(FIELDS).concat(ATTRIBUTES).join("\t"));
    });
    
    var total = params.total;
    var searchFilter = params.searchFilter;
    var numPages = Math.ceil(total/PAGE_SIZE);
    var pageOffsets = getPageOffsets(numPages);
    var cancel, identifiers, progressIndex, output, errorCount;

    self.enableObs = ko.observable();
    self.valueObs = ko.observable();
    self.maxObs = ko.observable();
    self.statusObs = ko.observable();
    self.percentageObs = ko.observable();
    self.canContactByEmailObs = ko.observable(false);
    self.searchFilterObs = ko.observable(params.searchFilter || []);
    
    reset();
    
    self.startExport = function(vm, event) {
        reset();
        self.statusObs("Currently preparing your *.tsv file. Retrieving summaries...");
        event.target.setAttribute("disabled","disabled");
        doContinuePage();
    };
    self.download = function() {
        var blob = new Blob([HEADERS+output], {type: "text/tab-separated-values;charset=utf-8"});
        saveAs.saveAs(blob, "participants-"+utils.formatISODate()+".tsv");
    };
    self.close = function(vm, event) {
        reset();
        cancel = true;
        root.closeDialog();
    };
    
    function reset() {
        cancel = false;
        identifiers = [];
        progressIndex = 0;
        errorCount = 0;
        output = "";
        self.enableObs(false);
        self.valueObs(progressIndex);
        self.maxObs(total+numPages+1);
        self.statusObs("Press start to begin preparation of the *.tsv file. You may need to disable pop-up blocking for this website in order to receive the results (which will open in a new window).");
        self.percentageObs("0%");
    }
    function updateStatus(progressIndex) {
        var max = total+numPages+1;
        self.valueObs(progressIndex);
        
        var perc = ((progressIndex/max)*100).toFixed(0);
        if (perc > 100) { perc = 100; }
        self.percentageObs(perc+"%");
    }
    function doContinuePage(response) {
        if (cancel) { return; }
        if (response && response.items) {
            response.items.forEach(function(participant) {
                if (participant.status !== "unverified") {
                    identifiers.push(participant.id);
                } else {
                    console.log("unverified, skipping", participant.email);
                }
            });
        }
        updateStatus(progressIndex++);
        if (pageOffsets.length > 0) {
            setTimeout(doOnePage, PAGING_TIMEOUT);
        } else {
            self.statusObs("Currently preparing your *.tsv file. Retrieving records...");
            doContinueFetch();
        }
    }
    function doContinuePageError(response) {
        errorCount++;
        doContinuePage(response);
    }
    function doOnePage() {
        if (cancel) { return; }
        var offsetBy = pageOffsets.shift();
        serverService.getParticipants(offsetBy, PAGE_SIZE, searchFilter)
            .then(doContinuePage).catch(doContinuePageError);
    }
    function doContinueFetch(response) {
        if (cancel) { return; }
        if (canExport(response, self.canContactByEmailObs())) {
            output += "\n"+formatOneParticipant(response);
        }
        updateStatus(progressIndex++);
        if (identifiers.length > 0) {
            setTimeout(doOneFetch, TIMEOUT);
        } else {
            self.statusObs("Export finished. There were " + errorCount + " errors.");
            self.enableObs(true);
        }
    }
    function doContinueFetchError(response) {
        console.error(response);
        errorCount++;
        doContinueFetch(response);
    }
    function doOneFetch() {
        if (cancel) { return; }
        var identifier = identifiers.shift();
        serverService.getParticipant(identifier)
            .then(doContinueFetch).catch(doContinueFetchError);
    }
    function formatOneParticipant(participant) {
        var array = FIELDS.map(function(field) {
            var formatter = FIELD_FORMATTERS[field];
            var value = participant[field];
            return (formatter) ? formatter(value) : value;
        });
        ATTRIBUTES.forEach(function(field) {
            array.push(participant.attributes[field]);
        });
        return array.join("\t");
    }
};
