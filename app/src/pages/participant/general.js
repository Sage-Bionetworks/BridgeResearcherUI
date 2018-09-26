import {serverService} from '../../services/server_service';
import alerts from '../../widgets/alerts';
import Binder from '../../binder';
import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import utils from '../../utils';

const failureHandler = utils.failureHandler({
    redirectTo: "participants",
    redirectMsg: "Participant not found"
});
const OPTIONS = [
    {value: 'no_sharing', label:'No Sharing'},
    {value: 'sponsors_and_partners', label:'Sponsors And Partners'},
    {value: 'all_qualified_researchers', label:'All Qualified Researchers'}
];
const NEW_PARTICIPANT = {id:"new",attributes:{},email:'',phone:{number: '', regionCode: 'US'}};

function selectRoles(session) {
    let set = new Set();
    for (let i=0; i < session.roles.length; i++) {
        var role = session.roles[i];
        switch(role) {
            case 'admin':
                set.add('Worker');
                set.add('Administrator');
                /* falls through */
            case 'researcher':
                set.add("Researcher");
                /* falls through */
            case 'developer':
                set.add("Developer");
                /* falls through */
        }
    }
    var roles = Array.from(set);
    roles.sort();
    return roles;
}

module.exports = function(params) {
    let self = this;
    self.participant = NEW_PARTICIPANT;

    let binder = new Binder(self)
        .obs('showEnableAccount', false)
        .obs('isNew', (params.userId === "new"))
        .obs('healthCode', 'N/A', Binder.formatHealthCode)
        .obs('allDataGroups[]')
        .obs('createdOn', null, fn.formatDateTime)
        .obs('allRoles[]', [])
        .bind('email', null, null, (value) => fn.isBlank(value) ? null : value)
        .bind('phone', null, Binder.formatPhone, Binder.persistPhone)
        .bind('phoneRegion', 'US')
        .bind('attributes[]', [], Binder.formatAttributes, Binder.persistAttributes)
        .bind('emailVerified', false)
        .bind('phoneVerified', false)
        .bind('firstName')
        .bind('lastName')
        .bind('sharingScope')
        .bind('notifyByEmail')
        .bind('dataGroups[]')
        .bind('password')
        .bind('externalId', null, null, Binder.emptyToNull)
        .bind('languages', null, fn.formatLanguages, fn.persistLanguages)
        .bind('status')
        .bind('userId', params.userId)
        .bind('id', params.userId)
        .bind('roles[]', null, fn.formatRoles, fn.persistRoles)
        .obs('title', (params.userId === "new") ? "New participant" : "&#160;");
    
    fn.copyProps(self, root, 'isAdmin');

    self.statusObs.subscribe(function(status) {
        self.showEnableAccountObs(status !== "enabled");
    });

    self.emailLink = ko.computed(function() {
        return "mailto:" + self.emailObs();
    });
    self.phoneLink = ko.computed(function() {
        return "tel:" + self.phoneObs();
    });
    self.updateRegion = function(model, event) {
        if(event.target.classList.contains("item")) {
            self.phoneRegionObs(event.target.textContent);
        }
    };

    serverService.getSession().then((session) => {
        var roles = selectRoles(session);
        self.allRolesObs(roles);
    });

    function initStudy(study) {
        // there's a timer in the control involved here, we need to use an observer
        self.allDataGroupsObs(study.dataGroups || []);
        
        let attrs = self.study.userProfileAttributes.map(function(key) {
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
    function saveParticipant(participant) {
        if (self.isNewObs()) {
            return serverService.createParticipant(participant)
                .then(afterCreate)
                .then((response) => window.location = '#/participants/'+response.identifier+'/general');
        } else {
            return serverService.updateParticipant(participant);
        }
    }

    self.sharingScopeOptions = OPTIONS;

    self.formatPhone = function(phone, phoneRegion) {
        return (phone) ? (fn.flagForRegionCode(phoneRegion) + ' ' + phone) : '';
    };
    self.observerIcon = function(obs, valueObs) {
        if (valueObs() === null || valueObs() === '') { return ''; }
        return (obs()) ? "green ui check icon" : "orange ui exclamation triangle icon";
    };
    self.observerText = function(obs, valueObs) {
        if (valueObs() === null || valueObs() === '') { return ''; }
        return (obs()) ? "Verified" : "Unverified";
    };

    self.save = function(vm, event) {
        let participant = binder.persist(self.participant);
        // This should be updating the title, but it isn't, because the id is still "new".
        //binder.persist(participant);

        let updatedTitle = self.study.emailVerificationEnabled ? 
            fn.formatNameAsFullLabel(participant) : participant.externalId;
        function updateName(response) {
            self.titleObs(updatedTitle);
            return serverService.getParticipant(self.userIdObs());
        }

        utils.startHandler(vm, event);
        return saveParticipant(participant)
            .then(updateName)
            .then(binder.update())
            .then(utils.successHandler(vm, event, "Participant created."))
            .catch(failureHandler);
    };
    function noteInitialStatus(participant) {
        // The general page can be linked to using externalId: or healthCode:... here we 
        // fix the ID to the be real ID, then use that to call getParticipantName
        self.userIdObs(participant.id);
        if (!self.isNewObs()) {
            serverService.getParticipantName(participant.id).then(function(part) {
                self.titleObs(part.name);
            }).catch(failureHandler);
        }
        return participant;
    }
    
    serverService.getStudy()
        .then(binder.assign('study'))
        .then(initStudy)
        .then(getParticipant)
        .then(binder.assign('participant'))
        .then(noteInitialStatus)
        .then(binder.update())
        .catch(failureHandler);
};