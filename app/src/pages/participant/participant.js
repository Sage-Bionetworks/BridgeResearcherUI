var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');
var serverService = require('../../services/server_service');

var fields = ['email','name','sharingScope','notifyByEmail','dataGroups[]','allDataGroups[]',
    'attributes[]', 'healthCode', 'languages', 'roles'];

var usersEmail = null;

serverService.addSessionStartListener(function(session) {
    usersEmail = session.email;
});
serverService.addSessionEndListener(function() {
    usersEmail = null;
});

function formatList(list) {
    return list.map(function(el) {
        return utils.formatTitleCase(el);
    }).join(", ");
}

module.exports = function(params) {
    var self = this;
    
    utils.observablesFor(self, fields);
    self.emailObs(decodeURIComponent(params.email));
    
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
    self.updateDataGroups = function(vm, event) {
        utils.startHandler(vm, event);
        var email = vm.emailObs();
        var dataGroups = vm.dataGroupsObs();
        
        serverService.updateDataGroups(email, dataGroups)
            .then(utils.successHandler(vm, event, "Data groups updates."))
            .catch(utils.failureHandler(vm, event));
    };
    
    serverService.getStudy().then(function(study) {
        self.allDataGroupsObs.pushAll(study.dataGroups);
    }).catch(utils.errorHandler);

    serverService.getParticipant(self.emailObs()).then(function(response) {
        var scope = utils.snakeToTitleCase(response.sharingScope, "No sharing set");
        self.nameObs(utils.formatName(response));
        self.sharingScopeObs(scope);
        self.notifyByEmailObs(response.notifyByEmail ? "Yes" : "No");
        self.dataGroupsObs(response.dataGroups);
        self.healthCodeObs(response.healthCode);
        self.languagesObs(response.languages.join(", "));
        self.rolesObs(formatList(response.roles));
        var attrs = Object.keys(response.attributes).map(function(key) {
            return {key: utils.snakeToTitleCase(key,''), value: response.attributes[key]};
        });
        self.attributesObs(attrs);
    }).catch(utils.errorHandler);
}