var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');

var fields = ['title','isNew','email','name','firstName','lastName','sharingScope','notifyByEmail',
    'dataGroups[]','password','healthCode','allDataGroups[]','attributes[]','externalId','languages',
    'externalIdEditable','status','createdOn','id','roles[]','allRoles[]'];
    
var persistedFields = ['firstName','lastName','sharingScope','notifyByEmail',
    'dataGroups[]','email','password','languages','externalId','status','id'];

var OPTIONS = [
    {value: 'no_sharing', label:'No Sharing'},
    {value: 'sponsors_and_partners', label:'Sponsors And Partners'},
    {value: 'all_qualified_researchers', label:'All Qualified Researchers'}
];
var STATUS_OPTIONS = [
    {value: 'enabled', label:'Enabled'},
    {value: 'disabled', label:'Disabled'},
    {value: 'unverified', label:'Unverified'}
];
var ROLES = ['Developer','Researcher','Administrator'];

function formatRoles(roles) {
    return (roles || []).map(function(role) {
         return (role === "admin") ? "Administrator" : utils.formatTitleCase(role);
    });
}
function unformatRoles(roles) {
    return (roles || []).map(function(role) {
         return (role === "Administrator") ? "admin" : role.toLowerCase();
    });
}

module.exports = function(params) {
    var self = this;
    
    var id = params.id;
    utils.observablesFor(self, fields);
    self.idObs(id);
    self.healthCodeObs('N/A');
    self.sharingScopeOptions = OPTIONS;
    self.statusOptions = STATUS_OPTIONS;
    self.study = null;
    
    if (id === "new") {
        self.isNewObs(true);
        self.titleObs('New participant');
    } else {
        self.isNewObs(false);
        self.titleObs(params.name);
    }

    function participantFromForm() {
        var participant = {attributes:{}};
        utils.observablesToObject(self, participant, persistedFields);
        
        participant.roles = unformatRoles(self.rolesObs());
        self.attributesObs().map(function(attr) {
            participant.attributes[attr.key] = attr.obs();
        });
        // This is not currently in an editor, so we have to coerce it to the correct form.
        if (self.languagesObs()) {
            participant.languages = self.languagesObs().split(/\W*,\W*/);    
        } else {
            delete participant.languages;
        }
        return participant;        
    }
    function loadStudy(study) {
        self.study = study;
        // there's a timer in the control involved here, we need to use an observer
        self.allDataGroupsObs(study.dataGroups);
        self.allRolesObs(ROLES);
        
        var attrs = self.study.userProfileAttributes.map(function(key) {
            return {key:key, label:utils.formatTitleCase(key,''), obs:ko.observable()}; 
        });
        self.attributesObs(attrs);
        var shouldBeEdited = !study.externalIdValidationEnabled || self.isNewObs();
        self.externalIdEditableObs(shouldBeEdited);
    }
    function getParticipant(response) {
        if (self.isNewObs()) {
            return null;
        }
        return serverService.getParticipant(id);        
    }
    function updateTitle(response) {
        self.titleObs(utils.formatName(response));
        return response;
    }
    function loadParticipant(response) {
        console.log(response);
        if (response == null) {
            return;
        }
        self.nameObs(utils.formatName(response));
        self.firstNameObs(response.firstName);
        self.lastNameObs(response.lastName);
        self.externalIdObs(response.externalId);
        self.sharingScopeObs(response.sharingScope);
        self.notifyByEmailObs(response.notifyByEmail);
        self.dataGroupsObs(response.dataGroups);
        self.createdOnObs(utils.formatDateTime(response.createdOn));
        self.emailObs(response.email);
        self.statusObs(response.status);
        if (self.study.healthCodeExportEnabled) {
            self.healthCodeObs(response.healthCode);    
        }
        self.languagesObs(response.languages.join(", "));
        self.rolesObs(formatRoles(response.roles));
        self.attributesObs().map(function(attr) {
            attr.obs(response.attributes[attr.key]);
        });
        if (!self.externalIdObs()) {
            self.externalIdEditableObs(true);
        }
    }
    function afterCreate(response) {
        var statusAfterCreate = self.study.emailVerificationEnabled ? "unverified" : "enabled";
        self.statusObs(statusAfterCreate);
        self.isNewObs(false);
        self.idObs(response.identifier);
        return response;
    }

    self.signOutUser = function(vm, event) {
        utils.startHandler(vm, event);
        
        serverService.signOutUser(id)
            .then(utils.successHandler(vm, event, "User signed out."))
            .catch(utils.failureHandler(vm, event));
    };
    self.save = function(vm, event) {
        var participant = participantFromForm();
        
        utils.startHandler(vm, event);
        updateTitle(participant);
        if (self.isNewObs()) {
            serverService.createParticipant(participant)
                .then(afterCreate)
                .then(utils.successHandler(vm, event, "Participant created."))
                .catch(utils.failureHandler(vm, event));
        } else {
            serverService.updateParticipant(participant)
                .then(utils.successHandler(vm, event, "Participant updated."))
                .catch(utils.failureHandler(vm, event));
        }
    };
    
    serverService.getStudy()
        .then(loadStudy)
        .then(getParticipant)
        .then(loadParticipant)
        .catch(utils.failureHandler());
}