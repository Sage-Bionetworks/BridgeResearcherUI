var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

var cssClassNameForStatus = {
    'disabled': 'negative',
    'unverified': 'warning',
    'verified': ''
};

module.exports = function() {
    var self = this;

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
    
    self.loadingFunc = function loadPage(offsetBy, pageSize, searchFilter) {
        return serverService.getParticipants(offsetBy, pageSize, searchFilter).then(function(response) {
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
        });
    }
};