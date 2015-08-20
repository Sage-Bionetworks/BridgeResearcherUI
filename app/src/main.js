require('../css/main');
var director = require('director');
var ko = require('knockout');
var $ = require('jquery');
var serverService = require('./services/server_service');
var utils = require('./utils');

ko.observableArray.fn.pushAll = function(valuesToPush) {
    var underlyingArray = this();
    this.valueWillMutate();
    ko.utils.arrayPushAll(underlyingArray, valuesToPush);
    this.valueHasMutated();
    return this;  //optional
};
ko.observableArray.fn.contains = function(value) {
    var underlyingArray = this();
    return underlyingArray.indexOf(value) > -1;
};
ko.bindingHandlers.ckeditor = {
    init: function(element, valueAccessor) {
        if (!CKEDITOR) {
            throw new Error("CK editor has not been loaded in the page");
        }
        var config = {
            toolbarGroups: [
                { name: 'clipboard', groups: ['clipboard','undo']},
                {"name":"basicstyles","groups":["basicstyles"]},
                {"name":"paragraph","groups":["list","blocks"]},
                {"name":"insert","groups":["insert"]},
                {"name":"styles","groups":["styles"]},
                {"name":"links","groups":["links"]}
            ],
            on: {
                instanceReady: function(event) {
                    var callback = valueAccessor();
                    callback(event.editor);
                }
            }
        };
        CKEDITOR.replace(element, config);
    }
};
ko.bindingHandlers.modal = {
    init: function(element, valueAccessor, ignored1, ignored2, bindingContext) {
        ko.bindingHandlers.component.init(element, valueAccessor, ignored1, ignored2, bindingContext);
    },
    update: function(element, valueAccessor, ignored1, ignored2, bindingContext) {
        var value = ko.unwrap(valueAccessor());
        var $modal = $(element).children(".modal");
        if ($modal.modal) {
            $modal.modal({"closable": false});
            if (value !== "none_dialog") {
                $modal.modal('show');
            } else {
                $modal.modal('hide');
            }
        }
    }
};

ko.components.register('info', {
    viewModel: require('./pages/info/info'), template: require('./pages/info/info.html')
});
ko.components.register('consent', {
    viewModel: require('./pages/consent/consent'), template: require('./pages/consent/consent.html')
});
ko.components.register('eligibility', {
    viewModel: require('./pages/eligibility/eligibility'), template: require('./pages/eligibility/eligibility.html')
});
ko.components.register('password_policy', {
    viewModel: require('./pages/password_policy/password_policy'), template: require('./pages/password_policy/password_policy.html')
});
ko.components.register('user_attributes', {
    viewModel: require('./pages/user_attributes/user_attributes'), template: require('./pages/user_attributes/user_attributes.html')
});
ko.components.register('ve_template', {
    viewModel: require('./pages/ve_template/ve_template'), template: require('./pages/ve_template/ve_template.html')
});
ko.components.register('rp_template', {
    viewModel: require('./pages/rp_template/rp_template'), template: require('./pages/rp_template/rp_template.html')
});
ko.components.register('actions', {
    viewModel: require('./pages/actions/actions'), template: require('./pages/actions/actions.html')
});
ko.components.register('surveys', {
    viewModel: require('./pages/surveys/surveys.js'), template: require('./pages/surveys/surveys.html')
});
ko.components.register('survey_versions', {
    viewModel: require('./pages/surveys/survey_versions.js'), template: require('./pages/surveys/survey_versions.html')
});
ko.components.register('survey', {
    viewModel: require('./pages/survey/survey.js'), template: require('./pages/survey/survey.html')
});
ko.components.register('schemas', {
    viewModel: require('./pages/schemas/schemas.js'), template: require('./pages/schemas/schemas.html')
});
ko.components.register('schedules', {
    viewModel: require('./pages/schedules/schedules.js'), template: require('./pages/schedules/schedules.html')
});
ko.components.register('form-message', {
    viewModel: require('./widgets/form_message/form_message'), template: require('./widgets/form_message/form_message.html')
});
ko.components.register('none_dialog', {
    template: require('./dialogs/none/none_dialog.html')
});
ko.components.register('sign_in_dialog', {
    viewModel: require('./dialogs/sign_in/sign_in'), template: require('./dialogs/sign_in/sign_in.html'), synchronous: true
});
ko.components.register('forgot_password_dialog', {
    viewModel: require('./dialogs/forgot_password/forgot_password'), template: require('./dialogs/forgot_password/forgot_password.html'), synchronous: true
});
ko.components.register('not_found', {
    template: require('./pages/not_found/not_found.html')
});
/* Surveys */
ko.components.register('SurveyQuestion', {
    template: require('./pages/survey/survey-question.html')
});
ko.components.register('SurveyInfoScreen', {
    template: require('./pages/survey/survey-info.html')
});
/*
ko.components.register('DateConstraints', {
    template: require('./pages/survey/constraints/date_constraints.html')
});
ko.components.register('DateTimeConstraints', {
    template: require('./pages/survey/constraints/datetime_constraints.html')
});
ko.components.register('IntegerConstraints', {
    template: require('./pages/survey/constraints/numerical_constraints.html')
});
ko.components.register('DecimalConstraints', {
    template: require('./pages/survey/constraints/numerical_constraints.html')
});
ko.components.register('StringConstraints', {
    template: require('./pages/survey/constraints/string_constraints.html')
});
ko.components.register('MultiValueConstraints', {
    template: require('./pages/survey/constraints/multi_constraints.html')
});
*/
ko.components.register('BooleanConstraints', {
    viewModel: require('./pages/survey/constraints/constraints'), template: require('./pages/survey/constraints/boolean_constraints.html')
});
ko.components.register('DateConstraints', {
    viewModel: require('./pages/survey/constraints/constraints'), template: require('./pages/survey/constraints/date_constraints.html')
});
ko.components.register('DateTimeConstraints', {
    viewModel: require('./pages/survey/constraints/constraints'), template: require('./pages/survey/constraints/datetime_constraints.html')
});
ko.components.register('IntegerConstraints', {
    viewModel: require('./pages/survey/constraints/constraints'), template: require('./pages/survey/constraints/numerical_constraints.html')
});
ko.components.register('DecimalConstraints', {
    viewModel: require('./pages/survey/constraints/constraints'), template: require('./pages/survey/constraints/numerical_constraints.html')
});
ko.components.register('StringConstraints', {
    viewModel: require('./pages/survey/constraints/constraints'), template: require('./pages/survey/constraints/string_constraints.html')
});
ko.components.register('MultiValueConstraints', {
    viewModel: require('./pages/survey/constraints/constraints'), template: require('./pages/survey/constraints/multi_constraints.html')
});
/* Shared rules display */
ko.components.register('rules', {
    template: require('./pages/survey/constraints/rules.html')
});
ko.components.register('constraints-label', {
    template: require('./pages/survey/constraints/constraints-label.html')
});
ko.components.register('ui-hint', {
    template: require('./pages/survey/constraints/ui-hint.html')
});


var RootViewModel = function() {
    var self = this;

    self.sessionToken = ko.observable("");
    self.environment = ko.observable("");
    self.studyName = ko.observable("Sage Bionetworks");

    self.selected = ko.observable('info');
    self.sessionToken = ko.observable("");
    self.roles = ko.observableArray();

    self.mainPage = ko.observable('info');
    self.mainPage.subscribe(self.selected);
    self.mainParams = ko.observable({});

    self.currentDialog = ko.observable('none_dialog');

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
            console.log("PARAMS", name, guid, createdOn);
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
        self.sessionToken(session.sessionToken);
        self.environment(" [" + session.environment + "]");
        self.roles(session.roles);
    });
    serverService.addSessionEndListener(function(session) {
        self.studyName("");
        self.sessionToken("");
        self.environment("");
        self.roles([]);
    });

    utils.eventbus.addListener('dialogs', function(value) {
        if (value === "none_dialog") {
            $(".modal").modal('hide');
        }
        self.currentDialog(value);
    });
};
var root = new RootViewModel();
ko.applyBindings(root, document.body);

serverService.addSessionStartListener(function() {
    utils.eventbus.emit('dialogs', 'none_dialog');
});
serverService.addSessionEndListener(function() {
    root.currentDialog('sign_in_dialog');
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
router.on('/survey/:guid/:createdOn', root.surveyRoute('survey'));
router.on('/survey_versions/:guid', root.surveyRoute('survey_versions'));
router.on('/surveys', root.routeTo('surveys'));
router.on('/schemas', root.routeTo('schemas'));
router.on('/schedules', root.routeTo('schedules'));
router.configure({notfound: root.routeTo('not_found')});
router.init();

// Make this global for Semantic UI.
window.jQuery = $;
