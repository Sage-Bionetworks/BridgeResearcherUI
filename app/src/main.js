require('../css/main');
require('./auth/auth');
var director = require('director');
var ko = require('knockout');
var $ = require('jquery');
var serverService = require('./services/server_service');

$.fn.serializeJSON = function() {
    var json = this.serializeArray().reduce(function(obj, el) {
        obj[el.name] = el.value;
        return obj;
    }, {});
    return JSON.stringify(json);
};
ko.observableArray.fn.pushAll = function(valuesToPush) {
    var underlyingArray = this();
    this.valueWillMutate();
    ko.utils.arrayPushAll(underlyingArray, valuesToPush);
    this.valueHasMutated();
    return this;  //optional
};

ko.components.register('info', {
    viewModel: require('./info/info'), template: require('./info/info.html')
});
ko.components.register('consent', {
    viewModel: require('./consent/consent'), template: require('./consent/consent.html')
});
ko.components.register('eligibility', {
    viewModel: require('./eligibility/eligibility'), template: require('./eligibility/eligibility.html')
});
ko.components.register('password_policy', {
    viewModel: require('./password_policy/password_policy'), template: require('./password_policy/password_policy.html')
});
ko.components.register('user_attributes', {
    viewModel: require('./user_attributes/user_attributes'), template: require('./user_attributes/user_attributes.html')
});
ko.components.register('ve_template', {
    viewModel: require('./ve_template/ve_template'), template: require('./ve_template/ve_template.html')
});
ko.components.register('rp_template', {
    viewModel: require('./rp_template/rp_template'), template: require('./rp_template/rp_template.html')
});
ko.components.register('actions', {
    viewModel: require('./actions/actions'), template: require('./actions/actions.html')
});
ko.components.register('not_found', {
    viewModel: require('./not_found/not_found'), template: require('./not_found/not_found.html')
});

var RootViewModel = function() {
    var self = this;

    self.selected = ko.observable('not_found');
    self.sessionToken = ko.observable("");

    self.mainPage = ko.observable('not_found');
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
    notfound: root.routeTo('not_found')
}).init();

// Make this global for Semantic UI.
window.jQuery = $;