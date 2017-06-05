var serverService = require('../../services/server_service');
var ko = require('knockout');
var utils = require('../../utils');
var bind = require('../../binder');
var fn = require('../../functions');
var alerts = require('../../widgets/alerts');
var root = require('../../root');

var failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});
var OPTIONS = [
    {value: 'no_sharing', label:'No Sharing'},
    {value: 'sponsors_and_partners', label:'Sponsors And Partners'},
    {value: 'all_qualified_researchers', label:'All Qualified Researchers'}
];
var ROLES = ["Developer", "Researcher", "Administrator", "Worker"];
var NEW_PARTICIPANT = {id:"new",attributes:{}};

module.exports = function(params) {
    var self = this;

    var binder = bind(self)
        .obs('showEnableAccount', false)
        .obs('isNew', (params.userId === "new"))
        .obs('healthCode', 'N/A', bind.formatHealthCode)
        .obs('allDataGroups[]')
        .obs('createdOn', null, fn.formatDateTime)
        .obs('allRoles[]', ROLES)
        .bind('email')
        .bind('attributes[]', [], bind.formatAttributes, bind.persistAttributes)
        .bind('firstName')
        .bind('lastName')
        .bind('sharingScope')
        .bind('notifyByEmail')
        .bind('dataGroups[]')
        .bind('password')
        .bind('externalId')
        .bind('languages', null, fn.formatLanguages, fn.persistLanguages)
        .bind('status')
        .bind('userId', params.userId)
        .bind('id', params.userId)
        .bind('roles[]', null, fn.formatRoles, fn.persistRoles)
        .obs('title', (params.userId === "new") ? "New participant" : "&#160;");
    
    self.isPublicObs = root.isPublicObs;
    if (!self.isNewObs()) {
        serverService.getParticipantName(self.userIdObs()).then(function(part) {
            self.titleObs(root.isPublicObs() ? part.name : part.externalId);
        }).catch(failureHandler);
    }
    
    self.statusObs.subscribe(function(status) {
        self.showEnableAccountObs(status !== "enabled");
    });

    function initStudy(study) {
        // there's a timer in the control involved here, we need to use an observer
        self.allDataGroupsObs(study.dataGroups || []);
        
        var attrs = self.study.userProfileAttributes.map(function(key) {
            return {key:key, label: fn.formatTitleCase(key,''), obs: ko.observable()}; 
        });
        self.attributesObs(attrs);
    }
    function getParticipant(response) {
        return (self.isNewObs()) ?
            Promise.resolve(NEW_PARTICIPANT) :
            serverService.getParticipant(self.userIdObs());
    }
    function afterCreate(response) {
        self.statusObs("enabled");
        self.isNewObs(false);
        self.idObs(response.identifier);
        self.userIdObs(response.identifier);
        return response;
    }
    function signOut() {
        return serverService.signOutUser(self.userIdObs());        
    }
    function saveParticipant(participant) {
        if (self.isNewObs()) {
            return serverService.createParticipant(participant)
                .then(afterCreate);
        } else {
            return serverService.updateParticipant(participant);
        }
    }

    self.sharingScopeOptions = OPTIONS;

    self.enableAccount = function(vm, event) {
        alerts.confirmation("Are you sure?\nWe will save any updates before enabling the account.", function() {
            self.statusObs("enabled");
            self.save(vm, event);
        });
    };
    self.disableAccount = function(vm, event) {
        alerts.confirmation("Are you sure?\nWe will save any updates before disabling the account.", function() {
            self.statusObs("disabled");
            self.save(vm, event).then(signOut);
        });
    };
    self.requestResetPassword = function(vm, event) {
        utils.startHandler(vm, event);
        
        serverService.requestResetPasswordUser(self.userIdObs())
            .then(utils.successHandler(vm, event, "Reset password email has been sent to user."))
            .catch(failureHandler);
    };
    self.signOutUser = function(vm, event) {
        utils.startHandler(vm, event);
        
        serverService.signOutUser(self.userIdObs())
            .then(utils.successHandler(vm, event, "User signed out."))
            .catch(failureHandler);
    };
    self.save = function(vm, event) {
        var participant = binder.persist(NEW_PARTICIPANT);
        // This should be updating the title, but it isn't, because the id is still "new".
        binder.persist(participant);

        var updatedTitle = self.isPublicObs() ? 
            fn.formatName(participant) : participant.externalId;
        function updateName() {
            self.titleObs(updatedTitle);
        }

        utils.startHandler(vm, event);
        saveParticipant(participant)
            .then(updateName)
            .then(utils.successHandler(vm, event, "Participant created."))
            .catch(failureHandler);
    };
    
    serverService.getStudy()
        .then(binder.assign('study'))
        .then(initStudy)
        .then(getParticipant)
        .then(binder.update())
        .catch(failureHandler);
};