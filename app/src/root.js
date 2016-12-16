var ko = require('knockout');
var serverService = require('./services/server_service');
var config = require('./config');
var toastr = require('toastr');
var bind = require('./binder');
var clipboard = require('./widgets/clipboard/clipboard');

// When you enable this, 1) everything is a bit faster, and 2) the UI is completely broken.
// ko.options.deferUpdates = true;

// Used in navigation to keep a section highlighted as you navigate into it.
var participantPages = ['enrollees','participants','participant_general','participant_consents', 
    'participant_reports', 'participant_report', 'participant_activities', 'participant_uploads', 
    'participant_upload'];

var pageSets = {
    'settings/general': ['general', 'email', 'data_groups', 'password_policy', 'eligibility', 'user_attributes', 'synapse'],
    'surveys': ['surveys','survey','survey_versions', "survey_schema"],
    'schemas': ['schemas','schema','schema_versions'],
    'scheduleplans': ['scheduleplans','scheduleplan'],
    'email_templates': ['verify_email', 'reset_password'],
    'subpopulations': ['subpopulations', 'subpopulation', 'subpopulation_editor', 'subpopulation_history', 'subpopulation_download'],
    'participants': participantPages,
    'enrollees': participantPages,
    'admin/info': ['admin_info'],
    'admin/cache': ['admin_cache'],
    'reports': ['reports', 'report']
};
function roleFunc(observer, role) {
    return ko.computed(function() {return observer().indexOf(role) > -1;});        
}

toastr.options = config.toastr;

var RootViewModel = function() {
    var self = this;

    bind(self)
        .obs('environment', '')
        .obs('studyName', '')
        .obs('studyIdentifier')
        .obs('selected', '')
        .obs('roles[]', [])
        .obs('mainPage', 'start')
        .obs('mainParams', {})
        .obs('editorPanel', 'none')
        .obs('editorParams', {})
        .obs('isPublic', false)
        .obs('codesEnumerated', false)
        .obs('codeRequired', false)
        .obs('isEditorTabVisible', false)
        .obs('sidePanel', 'navigation')
        .obs('showNavigation', true)
        .obs('dialog', {name: 'none'});

    self.clipboard = clipboard;

    self.mainPageObs.subscribe(self.selectedObs);
    self.mainPageObs.subscribe(function() {
        self.setEditorPanel('none',{});
    });
    self.showNav = function() {
        self.showNavigationObs(true);
    };
    self.hideNav = function() {
        self.showNavigationObs(false);
    };
    self.setEditorPanel = function(name, params) {
        self.editorPanelObs(name);
        self.editorParamsObs(params);
        self.isEditorTabVisibleObs(name !== 'none');
        self.sidePanelObs('editor');
    };
    self.setSidebarPanel = function(vm, event) {
        if (event.target.nodeName === "A") {
            self.sidePanelObs(event.target.textContent.toLowerCase());
        }
    };
    self.isActive = function(tag) {
        if (pageSets[tag]) {
            return pageSets[tag].indexOf(self.selectedObs()) > -1;
        }
        return tag === self.selectedObs();
    };
    self.isSidebarActive = function(tag) {
        return self.sidePanelObs() === tag;
    };
    self.signOut = function() {
        console.log("Signing out.");
        serverService.signOut();
    };
    self.changeView = function(name, params) {
        self.isEditorTabVisibleObs(false);
        self.sidePanelObs('navigation');
        self.mainPageObs(name);
        self.mainParamsObs(params);
    };
    self.readAboutClipboard = function() {
        self.openDialog('read_about_clipboard');
    };

    self.isResearcher = roleFunc(self.rolesObs, 'researcher');
    self.isDeveloper = roleFunc(self.rolesObs, 'developer');
    self.isAdmin = roleFunc(self.rolesObs, 'admin');

    self.openDialog = function(dialogName, params) {
        self.dialogObs({name: dialogName, params: params});
    };
    self.closeDialog = function() {
        self.dialogObs({name: 'none'});
    };
    self.isDevEnvObs = ko.computed(function() {
        return ['local','develop','staging'].indexOf(self.environmentObs()) > -1; 
    });
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
        self.studyNameObs("&ldquo;" + session.studyName + "&rdquo;");
        self.environmentObs(session.environment);
        self.studyIdentifierObs(session.studyId);
        self.rolesObs(session.roles);
        self.closeDialog();
        serverService.getStudy().then(function(study) {
            // Until we can support on server, enumerating the codes is the same as requiring the code at sign up.
            // isPublic = emailVerificationEnabled
            // codesEumerated = externalIdValidationEnabled
            // codeRequired = requiresExternalIdOnSignUp (doesn't exist) 
            var defaults = {
                isPublic: study.emailVerificationEnabled,
                codesEnumerated: study.externalIdValidationEnabled,
                codeRequired: study.externalIdValidationEnabled
            };
            var studyConfig = config.studies[study.identifier] || {};
            var opts = Object.assign({}, defaults, studyConfig);
            
            self.isPublicObs(opts.isPublic);
            self.codesEnumeratedObs(opts.codesEnumerated);
            self.codeRequiredObs(opts.codeRequired);
            console.debug("[config]", Object.keys(opts).map(function(key) { return key + "=" + opts[key]; }).join(', '));
        });
    });
    serverService.addSessionEndListener(function(session) {
        self.studyNameObs("");
        self.environmentObs("");
        self.studyIdentifierObs("");
        self.rolesObs([]);
        self.isPublicObs(false);
        self.codesEnumeratedObs(false);
        self.codeRequiredObs(false);
        self.openDialog('sign_in_dialog');
    });
};

var root = new RootViewModel();

root.queryParams = {};
if (document.location.search) {
    document.location.search.substring(1).split("&").forEach(function(pair) {
        var fragments = pair.split("=");
        root.queryParams[decodeURIComponent(fragments[0])] = decodeURIComponent(fragments[1]);
    });
}
console.debug("root.queryParams", root.queryParams);

module.exports = root;
ko.applyBindings(root, document.body);

window.addEventListener("load", function() {
    document.body.style.opacity = "1.0";
}, false);