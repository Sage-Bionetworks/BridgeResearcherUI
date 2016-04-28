var ko = require('knockout');
var saveAs = require('../../../lib/filesaver.min.js');
var serverService = require('../../services/server_service');
var root = require('../../root');
var utils = require('../../utils');

var TIMEOUT = 1500;

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
        return fields.join("\t") + "\t" + attrFields.join("\t");
    }
    return fields.join("\t");
}

module.exports = function(params) {
    var self = this;
    
    var cancel, identifiers, progressIndex, output, fields, attrFields, errorCount;
    var total = params.total;
    var pageSize = 100;
    var numPages = Math.ceil(total/pageSize);
    var searchFilter = params.searchFilter;
    var pageOffsets = getPageOffsets(numPages, pageSize);

    self.enableObs = ko.observable();
    self.valueObs = ko.observable();
    self.maxObs = ko.observable();
    self.statusObs = ko.observable();
    self.percentageObs = ko.observable();
    
    reset();
    
    self.startExport = function(vm, event) {
        reset();
        self.statusObs("Currently preparing your *.tsv file. Retrieving summaries...");
        event.target.setAttribute("disabled","disabled");
        doContinuePage();
    };
    self.download = function() {
        var headers = getHeaderLabels(fields, attrFields);
        var blob = new Blob([headers+output], {type: "text/tab-separated-values;charset=utf-8"});
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
        fields = null;
        attrFields = null;
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
                identifiers.push(participant.id);
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
    function doContinuePageError(response) {
        errorCount++;
        doContinuePage(response);
    }
    function doOnePage() {
        if (cancel) { return; }
        var offsetBy = pageOffsets.shift();
        serverService.getParticipants(offsetBy, pageSize, searchFilter)
            .then(doContinuePage).catch(doContinuePageError);
    }
    function doContinueFetch(response) {
        if (cancel) { return; }
        if (response && response.email) {
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
        if (fields === null) {
            fields = getFieldListFor(participant);
        }
        if (attrFields === null) {
            attrFields = getAttrFieldsFor(participant);    
        }
        var array = []
        for (var i=0; i < fields.length; i++) {
            var field = fields[i];
            var value = participant[field];
            if (fieldHandlers[field]) {
                array.push(fieldHandlers[field](value));
            } else {
                array.push(value);
            }
        }
        for (var i=0; i < attrFields.length; i++) {
            array.push(participant.attributes[attrFields[i]]);
        }
        return array.join("\t");
    }
}
