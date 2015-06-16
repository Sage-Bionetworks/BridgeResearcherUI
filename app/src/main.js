require('../css/main');
require('./pages/auth/auth');
var director = require('director');
var ko = require('knockout');
var $ = require('jquery');
var serverService = require('./services/server_service');

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
ko.bindingHandlers.createEditor = {
    init: function(element, valueAccessor) {
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
                    valueAccessor().initEditor();
                }
            }
        };
        CKEDITOR.replace(element, config);
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
ko.components.register('form-message', {
    viewModel: require('./widgets/form_message/form_message'), template: require('./widgets/form_message/form_message.html')
});

var RootViewModel = function() {
    var self = this;

    self.selected = ko.observable('info');
    self.sessionToken = ko.observable("");

    self.mainPage = ko.observable('info');
    self.mainPage.subscribe(self.selected);

    self.routeTo = function(name) {
        return function() {
            self.mainPage(name);
        }
    };
};
var root = new RootViewModel();
ko.applyBindings(root, document.querySelector("#page-context"));

// This is for debugging, and will be removed.
serverService.addSessionStartListener(function(session) {
    $("#sessionToken").text(session.sessionToken);
});
serverService.addSessionEndListener(function(session) {
    $("#sessionToken").text("");
});

director.Router({
    'info': root.routeTo('info'),
    'consent': root.routeTo('consent'),
    'eligibility': root.routeTo('eligibility'),
    'password_policy': root.routeTo('password_policy'),
    'user_attributes': root.routeTo('user_attributes'),
    'verify_email_template': root.routeTo('ve_template'),
    'reset_password_template': root.routeTo('rp_template'),
    'actions': root.routeTo('actions'),
    'signOut': serverService.signOut
}).configure({
    notfound: root.routeTo('info')
}).init();

// Make this global for Semantic UI.
window.jQuery = $;