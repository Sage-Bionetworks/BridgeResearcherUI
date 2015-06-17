require('../css/main');
//require('./pages/auth/auth');
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
}

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

var RootViewModel = function() {
    var self = this;

    self.selected = ko.observable('info');
    self.sessionToken = ko.observable("");

    self.mainPage = ko.observable('info');
    self.mainPage.subscribe(self.selected);

    self.currentDialog = ko.observable('none_dialog');

    self.signOut = function() {
        console.log("Signing out.")
        serverService.signOut();
    };

    self.routeTo = function(name) {
        return function() {
            self.mainPage(name);
        }
    };

    utils.eventbus.addListener('dialogs', function(value) {
        if (value === "none_dialog") {
            $(".modal").modal('hide');
        }
        self.currentDialog(value);
    });
};
var root = new RootViewModel();
ko.applyBindings(root, document.body);

// This is for debugging, and will be removed.
serverService.addSessionStartListener(function(session) {
    $("#sessionToken").text(session.sessionToken);
});
serverService.addSessionEndListener(function(session) {
    $("#sessionToken").text("");
});
serverService.addSessionStartListener(function() {
    utils.eventbus.emit('dialogs', 'none_dialog');
});
serverService.addSessionEndListener(function() {
    root.currentDialog('sign_in_dialog');
});

director.Router({
    'info': root.routeTo('info'),
    'consent': root.routeTo('consent'),
    'eligibility': root.routeTo('eligibility'),
    'password_policy': root.routeTo('password_policy'),
    'user_attributes': root.routeTo('user_attributes'),
    'verify_email_template': root.routeTo('ve_template'),
    'reset_password_template': root.routeTo('rp_template'),
    'actions': root.routeTo('actions')
}).configure({
    notfound: root.routeTo('info')
}).init();

// Make this global for Semantic UI.
window.jQuery = $;
