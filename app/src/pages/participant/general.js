var serverService = require('../../services/server_service');
var ko = require('knockout');
var utils = require('../../utils');
var bind = require('../../binder');
var fn = require('../../transforms');
var alerts = require('../../widgets/alerts');
var root = require('../../root');

var OPTIONS = [
    {value: 'no_sharing', label:'No Sharing'},
    {value: 'sponsors_and_partners', label:'Sponsors And Partners'},
    {value: 'all_qualified_researchers', label:'All Qualified Researchers'}
];
var ROLES = ["Developer", "Researcher", "Administrator", "Worker"];
var NEW_PARTICIPANT = {id:"new",attributes:{}};

module.exports = function(params) {
    var self = this;
    var userId = params.userId;

    var binder = bind(self)
        .obs('showEnableAccount', false)
        .obs('isNew', (userId === "new"))
        .obs('healthCode', 'N/A', fn.formatHealthCode)
        .obs('allDataGroups[]')
        .obs('externalIdEditable')
        .obs('createdOn', null, fn.formatLocalDateTime)
        .obs('allRoles[]', ROLES)
        .bind('email')
        .bind('attributes[]', [], fn.formatAttributes, fn.persistAttributes)
        .bind('firstName')
        .bind('lastName')
        .bind('sharingScope')
        .bind('notifyByEmail')
        .bind('dataGroups[]')
        .bind('password')
        .bind('externalId')
        .bind('languages', null, fn.formatLanguages, fn.persistLanguages)
        .bind('status')
        .bind('userId', userId)
        .bind('id', userId)
        .bind('roles[]', null, fn.formatRoles, fn.persistRoles)
        .obs('title', (userId === "new") ? "New participant" : "&#160;");
    
    self.isPublicObs = root.isPublicObs;
    if (!self.isNewObs()) {
        serverService.getParticipantName(userId).then(function(part) {
            self.titleObs(root.isPublicObs() ? part.name : part.externalId);
        }).catch(utils.failureHandler());
    }
    
    self.statusObs.subscribe(function(status) {
        self.showEnableAccountObs(status !== "enabled");
    });

    function initStudy(study) {
        // there's a timer in the control involved here, we need to use an observer
        self.allDataGroupsObs(study.dataGroups || []);
        
        var attrs = self.study.userProfileAttributes.map(function(key) {
            return {key:key, label:fn.formatTitleCase(key,''), obs:ko.observable()}; 
        });
        self.attributesObs(attrs);
        var shouldBeEdited = !study.externalIdValidationEnabled || self.isNewObs();
        self.externalIdEditableObs(shouldBeEdited);
    }
    function getParticipant(response) {
        return (self.isNewObs()) ?
            Promise.resolve(NEW_PARTICIPANT) :
            serverService.getParticipant(userId);
    }
    function afterCreate(response) {
        self.statusObs("enabled");
        self.isNewObs(false);
        self.idObs(response.identifier);
        userId = response.identifier;
        return response;
    }
    function signOut() {
        return serverService.signOutUser(self.userIdObs());        
    }    
    self.sharingScopeOptions = OPTIONS;

    self.enableAccount = function(vm, event) {
        alerts.confirmation("We must save any updates before enabling the account.", function() {
            self.statusObs("enabled");
            self.save(vm, event);
        });
    };
    self.disableAccount = function(vm, event) {
        alerts.confirmation("We must save any updates before disabling the account.", function() {
            self.statusObs("disabled");
            self.save(vm, event).then(signOut);
        });
    };
    self.requestResetPassword = function(vm, event) {
        utils.startHandler(vm, event);
        
        serverService.requestResetPasswordUser(userId)
            .then(utils.successHandler(vm, event, "Reset password email has been sent to user."))
            .catch(utils.failureHandler(vm, event));
    };
    self.signOutUser = function(vm, event) {
        utils.startHandler(vm, event);
        
        serverService.signOutUser(userId)
            .then(utils.successHandler(vm, event, "User signed out."))
            .catch(utils.failureHandler(vm, event));
    };
    self.save = function(vm, event) {
        var participant = binder.persist(NEW_PARTICIPANT);
        // This should be updating the title, but it isn't, because the id is
        // still "new".
        binder.update()(participant);

        var updatedTitle = self.isPublicObs() ? fn.formatName(participant) : participant.externalId;
        function updateName() {
            self.titleObs(updatedTitle);
        }
        utils.startHandler(vm, event);
        if (self.isNewObs()) {
            return serverService.createParticipant(participant)
                .then(afterCreate)
                .then(updateName)
                .then(utils.successHandler(vm, event, "Participant created."))
                .catch(utils.failureHandler(vm, event));
        } else {
            return serverService.updateParticipant(participant)
                .then(updateName)
                .then(utils.successHandler(vm, event, "Participant updated."))
                .catch(utils.failureHandler(vm, event));
        }
    };
    
    serverService.getStudy()
        .then(binder.assign('study'))
        .then(initStudy)
        .then(getParticipant)
        .then(binder.update())
        .catch(utils.notFoundHandler("Participant", "participants"));
};