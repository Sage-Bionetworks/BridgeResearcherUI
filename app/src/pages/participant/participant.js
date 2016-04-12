var ko = require('knockout');
var utils = require('../../utils');
var serverService = require('../../services/server_service');

var fields = ['title','isNew','email','name','firstName','lastName','sharingScope','notifyByEmail',
    'dataGroups[]','password','healthCode','allDataGroups[]','attributes[]','externalId','languages',
    'roles','externalIdEditable','status','createdOn'];
    
var persistedFields = ['firstName','lastName','sharingScope','notifyByEmail',
    'dataGroups[]','email','password','languages','externalId','status'];

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
var STATUS_OPTIONS = [
    {value: 'enabled', label:'Enabled'},
    {value: 'disabled', label:'Disabled'},
    {value: 'unverified', label:'Unverified'}
];

module.exports = function(params) {
    var self = this;
    
    var email = decodeURIComponent(params.email);
    utils.observablesFor(self, fields);
    self.healthCodeObs('N/A');
    self.sharingScopeOptions = OPTIONS;
    self.statusOptions = STATUS_OPTIONS;
    self.study = null;
    
    if (email === "new") {
        self.isNewObs(true);
        self.titleObs('New participant');
    } else {
        self.isNewObs(false);
        self.titleObs(email);
        self.emailObs(email);
    }

    function participantFromForm() {
        var participant = {attributes:{}};
        utils.observablesToObject(self, participant, persistedFields);
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
        return serverService.getParticipant(email);        
    }
    function loadParticipant(response) {
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
        self.statusObs(response.status);
        if (self.study.healthCodeExportEnabled) {
            self.healthCodeObs(response.healthCode);    
        }
        self.languagesObs(response.languages.join(", "));
        self.rolesObs(formatList(response.roles));
        self.attributesObs().map(function(attr) {
            attr.obs(response.attributes[attr.key]);
        });
        if (!self.externalIdObs()) {
            self.externalIdEditableObs(true);
        }
    }
    function setNew() {
        self.isNewObs(false);
    }

    self.signOutUser = function(vm, event) {
        utils.startHandler(vm, event);
        
        serverService.signOutUser(email)
            .then(utils.successHandler(vm, event, "User signed out."))
            .catch(utils.failureHandler(vm, event));
    };
    self.save = function(vm, event) {
        var participant = participantFromForm();
        
        utils.startHandler(vm, event);
        if (self.isNewObs()) {
            serverService.createParticipant(participant)
                .then(setNew)
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