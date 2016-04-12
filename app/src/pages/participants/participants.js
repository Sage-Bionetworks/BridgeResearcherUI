var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');
var root = require('../../root');

var cssClassNameForStatus = {
    'disabled': 'negative',
    'unverified': 'warning',
    'verified': ''
};

module.exports = function() {
    var self = this;
        
    var participant = null; // for creation of participant using external ID only

    self.total = 0;
    self.searchFilter = null;
    self.study = null;

    self.recordsObs = ko.observable("");
    self.itemsObs = ko.observableArray([]);
    self.formatTitleCase = utils.formatTitleCase;
    self.formatName = utils.formatName;
    self.formatDateTime = utils.formatDateTime;
    self.classNameForStatus = function(user) {
        return cssClassNameForStatus[user.status];
    };
    
    function formatCount(total) {
        return (total+"").replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " user records";
    }
    self.exportDialog = function() {
        root.openDialog('participant_export', {searchFilter: self.searchFilter, total: self.total});    
    };
    
    self.loadingFunc = function loadPage(offsetBy, pageSize, searchFilter) {
        self.searchFilter = searchFilter;
        return serverService.getParticipants(offsetBy, pageSize, searchFilter).then(function(response) {
            self.total = response.total;
            self.recordsObs(formatCount(response.total));
            self.itemsObs(response.items);
            if (response.items.length === 0) {
                if (offsetBy > 0) {
                    // You can't switch studies or environments unless you reset this when it has 
                    // overshot the new list. So drop back and try and find the first page.
                    return self.loadingFunc(0, pageSize, searchFilter);
                } else {
                    document.querySelector(".loading_status").textContent = "There are no user accounts, or none that match the filter.";
                }
            }
            return response;
        }).catch(utils.failureHandler());
    }
    
    self.showCreateFromIdObs = ko.observable();
    self.create = function(vm, event) {
        utils.startHandler(vm, event);
        serverService.getExternalIds({offsetBy:0, pageSize: 1, assignmentFilter:false})
            .then(createParticipant)
            .then(function() {
                console.log(arguments);
                root.openDialog('show_participant', participant);
            })
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler(vm, event));
    };
    
    serverService.getStudy().then(function(study) {
        self.study = study;
        self.showCreateFromIdObs(study.externalIdValidationEnabled);     
    });
    
    function createParticipant(response) {
        if (response.items.length === 0) {
            throw new Error("There are no unassigned external IDs registered with your study. Please see the external identifers screen for more information.");
        }
        var nextId = response.items[0];
        participant = {
            email: createEmailTemplate(nextId.identifier),
            password: nextId.identifier,
            externalId: nextId.identifier,
            sharingScope: "sponsors_and_partners"
        };
        return serverService.createParticipant(participant);
    }
    function createEmailTemplate(identifier) {
        var email = self.study.supportEmail;
        var parts = email.split("@");
        if (parts[0].indexOf("+") > -1) {
            parts[0] = parts[0].split("+")[0];
        }
        return parts[0] + "+" + identifier + "@" + parts[1];
    }
};