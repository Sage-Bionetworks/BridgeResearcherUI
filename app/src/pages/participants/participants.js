var ko = require('knockout');
var serverService = require('../../services/server_service');
var utils = require('../../utils');

function notBlankName(array, value) {
    if (value !== '<EMPTY>' && value.length > 0) {
        array.push(value);
    }
}

module.exports = function() {
    var self = this;

    self.itemsObs = ko.observableArray([]);
    self.searchObs = ko.observable();
    self.search = function(vm, event) {
        if (event.keyCode === 13) {
            document.location = "#participants/" + encodeURIComponent(self.searchObs());
        }
        return true;
    };
    self.formatTitleCase = utils.formatTitleCase;
    self.formatName = function(data) {
        var array = [];
        notBlankName(array, data.firstName);
        notBlankName(array, data.lastName);
        return (array.length === 0) ? '—' : array.join(' ');
    };
    
    self.loadingFunc = function loadPage(offsetBy, pageSize) {
        return serverService.getParticipants(offsetBy, pageSize).then(function(response) {
            if (response.items.length) {
                self.itemsObs(response.items);
            } else if (offsetBy > 0) {
                // You can't switch studies or environments unless you reset this when it has 
                // overshot the new list. So drop back and try and find the first page.
                return self.loadingFunc(0, pageSize);
            } else {
                document.querySelector(".loading_status").textContent = "There are currently no user accounts.";
            }
            return response;
        });
    }
};