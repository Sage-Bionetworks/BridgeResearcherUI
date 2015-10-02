var ko = require('knockout');
var toastr = require('toastr');
var serverService = require('./services/server_service');
var config = require('./config');

// Used in navigation to keep a section highlighted as you navigate into it.
var pageSets = {
    'surveys': ['surveys','survey','survey_versions'],
    'schemas': ['schemas','schema','schema_versions'],
    'scheduleplans': ['scheduleplans','scheduleplan'],
    've_template': ['ve_template', 'rp_template']
};

toastr.options = config.toastr;

var RootViewModel = function() {
    var self = this;

    self.environment = ko.observable("");
    self.studyName = ko.observable("");

    self.selected = ko.observable('info');
    self.roles = ko.observableArray([]);

    self.mainPage = ko.observable('info');
    self.mainPage.subscribe(self.selected);
    self.mainParams = ko.observable({});
    self.dialogObs = ko.observable({name: 'none'});

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
            var date = null;
            try {
                if (createdOn) {
                    date = new Date(createdOn)
                    date.toISOString();
                }
            } catch(e) {
                date = null;
            }
            self.mainPage(name);
            self.mainParams({guid: guid, createdOn: date});
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
        console.debug("root.openDialog()", dialogName, params);
        self.dialogObs({name: dialogName, params: params});
    };
    self.closeDialog = function() {
        console.debug("root.closeDialog()");
        self.dialogObs({name: 'none'});
    };
    /**
     * Displays a message that we UI insiders like to call "a piece of toast"
     * @param severity {String} one of 'success', 'info', 'warning' or 'error'
     * @param message {String} the message for the toast
     */
    self.message = function(severity, message) {
        if (toastr[severity]) {
            toastr[severity](message);
        } else {
            throw new Error(severity + ' is not a message type');
        }
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


