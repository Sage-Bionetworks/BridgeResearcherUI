var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');

var fields = ['title','isNew','email','name','firstName','lastName','sharingScope','notifyByEmail',
    'dataGroups[]','password','healthCode','allDataGroups[]','attributes[]','externalId','languages',
    'roles'];
    
var persistedFields = ['firstName','lastName','sharingScope','notifyByEmail',
    'dataGroups[]','email','password','languages','externalId'];

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

var OPTIONS = [
    {value: 'no_sharing', label:'No Sharing'},
    {value: 'sponsors_and_partners', label:'Sponsors And Partners'},
    {value: 'all_qualified_researchers', label:'All Qualified Researchers'}
];

module.exports = function(params) {
    var self = this;
    
    var email = decodeURIComponent(params.email);
    utils.observablesFor(self, fields);
    self.healthCodeObs('N/A');
    self.sharingScopeOptions = OPTIONS;
    self.study = null;
    
    if (email === "new") {
        self.isNewObs(true);
        self.titleObs('New participant');
    } else {
        self.isNewObs(false);
        self.titleObs(email);
        self.emailObs(email);
    }

    self.signOutUser = function(vm, event) {
        utils.startHandler(vm, event);
        
        if (self.email === usersEmail) {
            serverService.signOut();    
        } else {
            serverService.signOutUser(self.email)
                .then(utils.successHandler(vm, event, "User signed out."))
                .catch(utils.failureHandler(vm, event));
        }
    };
    self.save = function(vm, event) {
        var participant = {attributes:{}};
        utils.observablesToObject(vm, participant, persistedFields);
        self.attributesObs().map(function(attr) {
            participant.attributes[attr.key] = attr.obs();
        });
        // This is not currently in an editor, so we have to coerce it to the correct form.
        if (self.languagesObs()) {
            participant.languages = self.languagesObs().split(/\W*,\W*/);    
        } else {
            delete participant.languages;
        }
        // TODO: It may now be possible to remove this.
        for (var prop in participant) {
            if (participant[prop] === "") {
                delete participant[prop];
            }
        }
        console.log(participant);
        // END TODO
        utils.startHandler(vm, event);
        if (self.isNewObs()) {
            serverService.createParticipant(participant)
                .then(utils.successHandler(vm, event, "Participant created."))
                .catch(utils.failureHandler(vm, event));
        } else {
            serverService.updateParticipant(participant)
                .then(utils.successHandler(vm, event, "Participant updated."))
                .catch(utils.failureHandler(vm, event));
        }
    };
    
    serverService.getStudy().then(function(study) {
        self.study = study;
        // there's a timer in the control involved here, we need to use an observer
        self.allDataGroupsObs(study.dataGroups);
        var attrs = self.study.userProfileAttributes.map(function(key) {
            self[key+"Label"] = utils.snakeToTitleCase(key,'');
            return {key: key, obs: ko.observable()}; 
        });
        self.attributesObs(attrs);
    }).then(function(response) {
        if (self.isNewObs()) {
            return;
        }
        serverService.getParticipant(email).then(function(response) {
            self.nameObs(utils.formatName(response));
            self.firstNameObs(response.firstName);
            self.lastNameObs(response.lastName);
            self.externalIdObs(response.externalId);
            self.sharingScopeObs(response.sharingScope);
            self.notifyByEmailObs(response.notifyByEmail);
            self.dataGroupsObs(response.dataGroups);
            if (self.study.healthCodeExportEnabled) {
                self.healthCodeObs(response.healthCode);    
            }
            self.languagesObs(response.languages.join(", "));
            self.rolesObs(formatList(response.roles));
            self.attributesObs().map(function(attr) {
                attr.obs(response.attributes[attr.key]);
            });
        }).catch(utils.errorHandler);        
    }).catch(utils.errorHandler);
}