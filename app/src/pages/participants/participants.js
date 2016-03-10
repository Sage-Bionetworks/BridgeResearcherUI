var ko = require('knockout');
var serverService = require('../../services/server_service');

module.exports = function() {
    var self = this;

    self.itemsObs = ko.observableArray([]);
    self.searchObs = ko.observable();
    self.search = function(vm, event) {
        if (event.keyCode === 13) {
            alert(self.searchObs());    
        }
        return true;
    };
    self.titleCase = function(text) {
        return text.substring(0,1).toUpperCase() + text.substring(1);  
    };
    
    self.loadingFunc = function loadPage(offsetBy, pageSize) {
        return serverService.getParticipants(offsetBy, pageSize).then(function(response) {
            if (response.items.length) {
                self.itemsObs(response.items);
            } else {
                document.querySelector(".loading_status").textContent = "There are currently no user accounts.";
            }
            return response;
        });
    }
};