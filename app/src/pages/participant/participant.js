var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');
var serverService = require('../../services/server_service');

var fields = ['email','name','firstName','lastName','sharingScope','notifyByEmail',
    'dataGroups[]','healthCode','allDataGroups[]','attributes[]','externalId','languages', 'roles'];
    
var persistedFields = ['firstName','lastName','sharingScope','notifyByEmail','dataGroups[]','languages'];

var usersEmail = null;

serverService.addSessionStartListener(function(session) {
    usersEmail = session.email;
});
serverService.addSessionEndListener(function() {
    usersEmail = null;
});

function formatList(list) {
    return (list || []).sort().map(function(el) {
        return utils.formatTitleCase(el);
    }).join(", ");
}

module.exports = function(params) {
    var self = this;
    
    utils.observablesFor(self, fields);
    self.emailObs(decodeURIComponent(params.email));
    self.healthCodeObs('N/A');
    
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
    self.save = function(vm, event) {
        var object = {}
        utils.observablesToObject(vm, object, persistedFields);
        self.study.userProfileAttributes.map(function(key) {
            object[key] = self[key+"Obs"]();
        });
        
        utils.startHandler(vm, event);
        var email = vm.emailObs();

        // TODO: This is broken until two PRs are accepted and merged.
        //var p1 = serverService.updateParticipantOptions(email, object);
        var p2 = serverService.updateParticipantProfile(email, object);
        Promise.all([p2])
            .then(utils.successHandler(vm, event, "Update updated."))
            .catch(utils.failureHandler(vm, event));
    };
    
    self.study = null;
    serverService.getStudy().then(function(study) {
        self.study = study;
        // there's a timer in the control involved here, we need to use an observer
        self.allDataGroupsObs(study.dataGroups);
        study.userProfileAttributes.map(function(key) {
            self[key+"Label"] = utils.snakeToTitleCase(key,'');
            self[key+"Obs"] = ko.observable();
        });
    }).then(function(response) {
        serverService.getParticipant(self.emailObs()).then(function(response) {
            var scope = utils.snakeToTitleCase(response.sharingScope, "No sharing set");
            self.nameObs(utils.formatName(response));
            self.firstNameObs(response.firstName);
            self.lastNameObs(response.lastName);
            self.externalIdObs(response.externalId);
            self.sharingScopeObs(scope);
            self.notifyByEmailObs(response.notifyByEmail ? "Yes" : "No");
            self.dataGroupsObs(response.dataGroups);
            if (self.study.healthCodeExportEnabled) {
                self.healthCodeObs(response.healthCode);    
            }
            self.languagesObs(response.languages.join(", "));
            self.rolesObs(formatList(response.roles));
            var attrs = self.study.userProfileAttributes.map(function(key) {
                self[key+"Obs"](response.attributes[key]);
                return {key: self[key+'Label'], value: response.attributes[key]}; 
            });
            self.attributesObs(attrs);
        }).catch(utils.errorHandler);        
    }).catch(utils.errorHandler);

}