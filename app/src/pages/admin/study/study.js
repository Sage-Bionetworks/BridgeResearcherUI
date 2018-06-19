import {serverService} from '../../../services/server_service';
import Binder from '../../../binder';
import ko from 'knockout';
import utils from '../../../utils';

const SYNAPSE_ADMINS = [
    {name: "Alx Dark", id: '2026857', obs: 'darkObs'},
    {name: "Brian Bot", id: '273979', obs: 'botObs'},
    {name: "Mike Kellen", id: '273984', obs: 'kellenObs'}
];

module.exports = function(params) {
    let self = this;

    let binder = new Binder(self)
        .bind('name', 'New Study')
        .bind('sponsorName')
        .bind('supportEmail')
        .bind('technicalEmail')
        .bind('consentNotificationEmail')
        .bind('users[]', [])
        .bind('allRoles[]', ['Developer','Researcher'])
        .bind('identifier')
        .bind('id', (params.id === 'new') ? null : params.id);

    SYNAPSE_ADMINS.forEach(function(admin) {
        self[admin.obs] = ko.observable(false);
    });

    self.addUser = function(index) {
        self.usersObs.splice(index+1,0,{
            emailObs: ko.observable(),
            firstNameObs: ko.observable(),
            lastNameObs: ko.observable(),
            rolesObs: ko.observableArray([])
        });
    };
    self.addBelow = function(item, event) {
        self.addUser( self.usersObs().indexOf(item) );
    };
    self.addFirstRow = function() {
        self.addUser(0);
    };
    self.save = function(vm, event) {
        let study = binder.persist({});
        let users = self.usersObs().map(function(user) {
            return {
                email: user.emailObs(),
                firstName: user.firstNameObs(),
                lastName: user.lastNameObs(),
                roles: user.rolesObs()
            };
        });
        let adminIds = SYNAPSE_ADMINS
            .filter(admin => self[admin.obs]())
            .map(admin => admin.id);

        delete study.allRoles;
        delete study.users;
        let payload = {
            study: study,
            adminIds: adminIds,
            users: users
        };
        utils.startHandler(vm, event);
        serverService.createStudy(payload)
            .then(utils.successHandler(vm, event, "Study created."))
            .catch(utils.failureHandler());
    };
    function load() {
        return (params.id === "new") ?
            Promise.resolve({}) :
            serverService.getStudyById(params.id);
    }

    load()
        .then(binder.assign('study'))
        .then(binder.update())
        .then(self.addUser(0));
        
};