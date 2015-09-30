var ko = require('knockout');
var serverService = require('./services/server_service');

console.log(ko);

// Used in navigation to keep a section highlighted as you navigate into it.
var pageSets = {
    'surveys': ['surveys','survey','survey_versions'],
    'schemas': ['schemas','schema','schema_versions'],
    'scheduleplans': ['scheduleplans','scheduleplan'],
    've_template': ['ve_template', 'rp_template']
};

var RootViewModel = function() {
    var self = this;

    self.environment = ko.observable("");
    self.studyName = ko.observable("");

    self.selected = ko.observable('info');
    self.roles = ko.observableArray();

    self.mainPage = ko.observable('info');
    self.mainPage.subscribe(self.selected);
    self.mainParams = ko.observable({});
    self.dialogObs = ko.observable({name: "none_dialog", params: {}});

    self.isActive = function(tag) {
        if (pageSets[tag]) {
            return pageSets[tag].indexOf(self.selected()) > -1;
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
    self.schemaRoute = function(name) {
        return function(schemaId, revision) {
            self.mainPage(name);
            self.mainParams({schemaId: schemaId, revision: (revision) ? revision : null});
        };
    };
    self.schedulePlanRoute = function(name) {
        return function(guid) {
            self.mainPage(name);
            self.mainParams({guid: guid});
        };
    };

    self.isResearcher = ko.computed(function() {
        return self.roles.contains('researcher');
    });

    self.isDeveloper = ko.computed(function() {
        return self.roles.contains('developer');
    });

    self.openDialog = function(dialogName, params) {
        console.log("root.openDialog()", dialogName, params);
        self.dialogObs({name: dialogName, params: params});
    };

    self.closeDialog = function() {
        console.log("root.closeDialog()");
        self.dialogObs({name: "none_dialog", params: {}});
    };

    serverService.addSessionStartListener(function(session) {
        self.studyName(session.studyName);
        self.environment(" [" + session.environment + "]");
        self.roles(session.roles);
        self.closeDialog();
    });
    serverService.addSessionEndListener(function(session) {
        self.studyName("");
        self.environment("");
        self.roles([]);
        self.openDialog('sign_in_dialog');
    });
};

module.exports = root = new RootViewModel();
ko.applyBindings(root, document.body);


