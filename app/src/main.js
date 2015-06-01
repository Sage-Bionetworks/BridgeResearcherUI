require('../css/main');
require('./auth/auth');
var director = require('director');
var ko = require('knockout');
var $ = require('jquery');
var sessionService = require('./services/session_service');

$.fn.serializeJSON = function() {
    var json = this.serializeArray().reduce(function(obj, el) {
        obj[el.name] = el.value;
        return obj;
    }, {});
    return JSON.stringify(json);
};
$.jsonPOST = function(url, data) {
    if (typeof data !== 'string') {
        data = JSON.stringify(data);
    }
    var output = data.replace(/"password":"([^"]*)"/, '"password":"[REDACTED]"');
    console.debug("POST", url, output);
    return $.ajax({method: 'POST', url: url,
        headers: {'Content-Type': 'application/json'},
        data: data, type: "application/json"
    });
};


// These can be made asynchronous.
ko.components.register('home', {
    viewModel: require('./home/home'), template: require('./home/home.html')
});
ko.components.register('study', {
    viewModel: require('./study/study'), template: require('./study/study.html')
});
ko.components.register('notFound', {
    viewModel: require('./not_found/not_found'), template: require('./not_found/not_found.html')
});

var RootViewModel = function() {
    this.mainPage = ko.observable("study");
    this.sessionToken = ko.observable("");

    this.routeTo = function(name) {
        return function() {
            this.mainPage(name);
        }.bind(this);
    };
};
var root = new RootViewModel();
ko.applyBindings(root, document.querySelector("#page-context"));

// This is for debugging, and will be removed.
sessionService.addListener(function(session) {
    var token = (session == null) ? "" : session.sessionToken;
    $("#sessionToken").text(token);
});

director.Router({
    'home': root.routeTo('home'),
    'study': root.routeTo('study'),
    'signOut': sessionService.endSession
}).configure({
    notfound: root.routeTo('notFound')
}).init();

// Make this global for Semantic UI.
window.jQuery = $;