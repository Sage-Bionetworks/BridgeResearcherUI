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
        
    self.total = 0;
    self.searchFilter = null;

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
    self.createDialog = function(vm, event) {
        root.openDialog('create_participant');
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
};