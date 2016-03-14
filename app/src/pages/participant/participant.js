var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');
var serverService = require('../../services/server_service');

var usersEmail = null;

serverService.addSessionStartListener(function(session) {
    usersEmail = session.email;
});
serverService.addSessionEndListener(function() {
    usersEmail = null;
});

module.exports = function(params) {
    var self = this;
    
    self.emailObs = ko.observable(decodeURIComponent(params.email));
    
    self.signOutUser = function(vm, event) {
        utils.startHandler(vm, event);
        var signOutEmail = vm.emailObs();
        
        if (signOutEmail === usersEmail) {
            serverService.signOut();    
        } else {
            serverService.signOutUser(vm.emailObs())
                .then(utils.successHandler(vm, event, "User signed out."))
                .catch(utils.failureHandler(vm, event));
        }
    };
}