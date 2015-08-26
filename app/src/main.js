require('../css/main');
require('../../node_modules/dragula/dist/dragula');
var director = require('director');
var ko = require('knockout');
var $ = require('jquery');
var serverService = require('./services/server_service');
var utils = require('./utils');
require('./bindings');
require('./registry');

var RootViewModel = function() {
    var self = this;

    self.environment = ko.observable("");
    self.studyName = ko.observable("Sage Bionetworks");

    self.selected = ko.observable('info');
    self.roles = ko.observableArray();

    self.mainPage = ko.observable('info');
    self.mainPage.subscribe(self.selected);
    self.mainParams = ko.observable({});

    self.dialogObs = ko.observable({name: "none_dialog", params: {}});

    // TODO: fix this so it's more flexible
    self.isActive = function(tag) {
        if (self.selected() === "survey" && tag === 'surveys') {
            return true;
        }
        return tag === self.selected();
    };

    self.signOut = function() {
        console.log("Signing out.");
        serverService.signOut();
    };

    self.routeTo = function(name) {
        return function(params) {
            self.mainPage(name);
            self.mainParams({});
        };
    };
    self.surveyRoute = function(name) {
        return function(guid, createdOn) {
            self.mainPage(name);
            self.mainParams({guid: guid, createdOn: (createdOn === "recent") ? null : createdOn});
        };
    };

    self.isResearcher = ko.computed(function() {
        return self.roles.contains('researcher');
    });

    self.isDeveloper = ko.computed(function() {
        return self.roles.contains('developer');
    });

    serverService.addSessionStartListener(function(session) {
        self.studyName(session.studyName);
        self.environment(" [" + session.environment + "]");
        self.roles(session.roles);
    });
    serverService.addSessionEndListener(function(session) {
        self.studyName("");
        self.environment("");
        self.roles([]);
    });
    utils.addDialogListener(function(name, params) {
        if ("close" === name) {
            $(".modal").modal('hide');
            name = "none_dialog";
        }
        self.dialogObs({name: name, params: params});
    });
};
var root = new RootViewModel();
ko.applyBindings(root, document.body);

serverService.addSessionStartListener(function() {
    utils.closeDialog();
});
serverService.addSessionEndListener(function() {
    utils.openDialog('sign_in_dialog');
});

var router = new director.Router();
router.param('guid', /([^\/]*)/);
router.param('createdOn', /([^\/]*)/);
router.on('/info', root.routeTo('info'));
router.on('/consent', root.routeTo('consent'));
router.on('/eligibility', root.routeTo('eligibility'));
router.on('/password_policy', root.routeTo('password_policy'));
router.on('/user_attributes', root.routeTo('user_attributes'));
router.on('/verify_email_template', root.routeTo('ve_template'));
router.on('/reset_password_template', root.routeTo('rp_template'));
router.on('/actions', root.routeTo('actions'));
router.on('/survey/:guid', root.surveyRoute('survey'));
router.on('/survey/:guid/:createdOn', root.surveyRoute('survey'));
router.on('/survey_versions/:guid', root.surveyRoute('survey_versions'));
router.on('/surveys', root.routeTo('surveys'));
router.on('/schemas', root.routeTo('schemas'));
router.on('/schedules', root.routeTo('schedules'));
router.configure({notfound: root.routeTo('not_found')});
router.init();

// Make this global for Semantic UI.
window.jQuery = $;
