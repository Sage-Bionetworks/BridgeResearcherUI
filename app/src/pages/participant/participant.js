var serverService = require('../../services/server_service');
var ko = require('knockout');
var utils = require('../../utils');
var bind = require('../../binder');
var fn = require('../../transforms');

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
var ROLES = ["Developer", "Researcher", "Administrator", "Worker"];
var NEW_PARTICIPANT = {attributes:{}};

module.exports = function(params) {
    var self = this;
    var id = params.id;

    var binder = bind(self)
        .obs('isNew', (id === "new"))
        .obs('name', null, fn.formatName)
        .obs('healthCode', 'N/A', fn.formatHealthCode)
        .obs('allDataGroups[]')
        .obs('externalIdEditable')
        .obs('createdOn', null, utils.formatDateTime)
        .obs('allRoles[]', ROLES)
        .bind('email')
        .bind('attributes[]', [], fn.formatAttributes, fn.persistAttributes)
        .bind('firstName')
        .bind('lastName')
        .bind('sharingScope')
        .bind('notifyByEmail')
        .bind('dataGroups[]', [])
        .bind('password')
        .bind('externalId')
        .bind('languages', null, fn.formatLanguages, fn.persistLanguages)
        .bind('status')
        .bind('id', id)
        .bind('roles[]', null, fn.formatRoles, fn.persistRoles)
        .bind('title', (id === "new") ? "New participant" : params.name, fn.formatTitle);
    
    function initStudy(study) {
        // there's a timer in the control involved here, we need to use an observer
        self.allDataGroupsObs(study.dataGroups || []);
        
        var attrs = self.study.userProfileAttributes.map(function(key) {
            return {key:key, label:fn.formatTitleCase(key,''), obs:ko.observable()}; 
        });
        self.attributesObs(attrs);
        var shouldBeEdited = !study.externalIdValidationEnabled || self.isNewObs();
        // External ID editing is still wrong in that I can edit the ID of an existing user, 
        // even though the codes are being managed in the study I'm looking at.
        self.externalIdEditableObs(shouldBeEdited);
    }
    function getParticipant(response) {
        return (self.isNewObs()) ?
            Promise.resolve(NEW_PARTICIPANT) :
            serverService.getParticipant(id);
    }
    function afterCreate(response) {
        var statusAfterCreate = self.study.emailVerificationEnabled ? "unverified" : "enabled";
        self.statusObs(statusAfterCreate);
        self.isNewObs(false);
        self.idObs(response.identifier);
        return response;
    }
    
    self.sharingScopeOptions = OPTIONS;
    self.statusOptions = STATUS_OPTIONS;

    self.requestResetPassword = function(vm, event) {
        utils.startHandler(vm, event);
        
        serverService.requestResetPasswordUser(id)
            .then(utils.successHandler(vm, event, "Reset password email has been sent to user."))
            .catch(utils.failureHandler(vm, event));
    };
    self.signOutUser = function(vm, event) {
        utils.startHandler(vm, event);
        
        serverService.signOutUser(id)
            .then(utils.successHandler(vm, event, "User signed out."))
            .catch(utils.failureHandler(vm, event));
    };
    self.save = function(vm, event) {
        var participant = binder.persist(NEW_PARTICIPANT);
        binder.update()(participant);

        utils.startHandler(vm, event);
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
    
    var notFoundHandler = utils.notFoundHandler(self, "Participant not found.", "#/participants");
    
    serverService.getStudy()
        .then(binder.assign('study'))
        .then(initStudy)
        .then(getParticipant)
        .then(binder.update())
        .catch(notFoundHandler);
};