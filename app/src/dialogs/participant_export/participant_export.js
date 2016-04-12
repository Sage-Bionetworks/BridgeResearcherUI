var ko = require('knockout');
var serverService = require('../../services/server_service');
var root = require('../../root');
var utils = require('../../utils');
    
var TIMEOUT = 40;
    
var fieldHandlers = {
    'consentHistories': function(value) {
        var consents = [];
        for (var prop in value) {
            var string = value[prop].map(formatConsentRecords).join('; ');
            consents.push(string);
        }
        return consents.join("; ");
    },
    'notifyByEmail': function(value) {
        return (value+'').toLowerCase();
    }
}
function formatConsentRecords(record) {
    var aString = record.subpopulationGuid;
    aString += " signedOn=" + utils.formatDateTime(record.signedOn);
    if (record.withdrewOn) {
        aString += ", withdrewOn=" + utils.formatDateTime(record.withdrewOn);
    }
    return aString;
}
function getAttrFieldsFor(record) {
    return Object.keys(record.attributes).sort();
}
function getFieldListFor(record) {
    var fields = Object.keys(record).sort();
    fields.splice(fields.indexOf("type"),1);
    fields.splice(fields.indexOf("attributes"),1);
    return fields;
}
function getPageOffsets(numPages, pageSize) {
    var pages = [];
    for (var i=0; i <= numPages; i++) {
        pages.push(i*pageSize);
    }
    return pages;
}
function getHeaderLabels(fields, attrFields) {
    if (attrFields.length) {
        return fields.join("\t") + "\t" + attrFields.join("\t") + "\n";
    }
    return fields.join("\t") + "\n";
}

module.exports = function(params) {
    var self = this;

    self.close = function(vm, event) {
        cancel = true;
        root.closeDialog();
    };
    
    var cancel = false;
    var total = params.total;
    var pageSize = 100;
    var numPages = Math.ceil(total/pageSize);
    var searchFilter = params.searchFilter;
    var pageOffsets = getPageOffsets(numPages, pageSize);
    var emails = [];
    var participants = [];
    var progressIndex = 0;
    
    self.enableObs = ko.observable(false);
    self.downloadHref = ko.observable("participants-"+utils.formatISODate()+".tsv");
    self.downloadFileName = ko.observable("");
    self.valueObs = ko.observable(progressIndex);
    self.maxObs = ko.observable(total+numPages+1);
    self.statusObs = ko.observable("Press start to begin preparation of the *.tsv file.");
    self.percentageObs = ko.observable("0%");
    // Percentage is ((self.valueObs()/self.maxObs())*100).toFixed(0) + "%"
    
    function updateStatus(progressIndex) {
        var max = total+numPages+1;
        self.valueObs(progressIndex);
        self.percentageObs(((progressIndex/max)*100).toFixed(0) + "%");
    }
    
    self.startExport = function(vm, event) {
        self.statusObs("Currently preparing your *.tsv file. Retrieving summaries...");
        event.target.setAttribute("disabled","disabled");
        doContinuePage();
    };
    
    function doContinuePage(response) {
        if (cancel) { return; }
        if (response && response.items) {
            response.items.forEach(function(participant) {
                emails.push(participant.email);
            });
        }
        updateStatus(progressIndex++);
        if (pageOffsets.length > 0) {
            setTimeout(doOnePage, TIMEOUT);
        } else {
            self.statusObs("Currently preparing your *.tsv file. Retrieving records...");
            doContinueFetch();
        }
    }
    function doOnePage() {
        if (cancel) { return; }
        var offsetBy = pageOffsets.shift();
        serverService.getParticipants(offsetBy, pageSize, searchFilter)
            .then(doContinuePage).catch(doContinuePage);
    }
    function doContinueFetch(response) {
        if (cancel) { return; }
        if (response && response.email) {
            participants.push(response);
        }
        updateStatus(progressIndex++);
        if (emails.length > 0) {
            setTimeout(doOneFetch, TIMEOUT);
        } else {
            self.statusObs("Export finished.");
            prepareFinalExport(participants);
        }
    }
    function doOneFetch() {
        if (cancel) { return; }
        var email = emails.shift();
        serverService.getParticipant(email)
            .then(doContinueFetch).catch(doContinueFetch);
    }
    
    function prepareFinalExport(records) {
        var fields = getFieldListFor(records[0]);
        var attrFields = getAttrFieldsFor(records[0]);
        var string = getHeaderLabels(fields, attrFields);
        
        var rowArray = [];
        string += records.map(function(record) {
             rowArray.length = 0;
             for (var i=0; i < fields.length; i++) {
                 var field = fields[i];
                 var value = record[field];
                 if (fieldHandlers[field]) {
                     rowArray.push(fieldHandlers[field](value));
                 } else {
                    rowArray.push(value);
                 }
             }
             for (var i=0; i < attrFields.length; i++) {
                 rowArray.push(record.attributes[attrFields[i]]);
             }
             return rowArray.join("\t");
        }).join("\n");
        self.downloadFileName('data:text/plain;charset=utf-8,' + encodeURIComponent(string));
        self.enableObs(true);
    }
    /*
    TODO:
        - select columns to export
        - web worker? The timeouts make this less important.
    */
}
