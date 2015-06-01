var $ = require('jquery');
var ko = require('knockout');
var mapping = require('knockout-mapping');
var config = require('../config');
var sessionService = require('../services/session_service');
var optionsService = require('../services/options_service');

// This is still the signin view model. There'll be another view model in this class.
var AuthViewModel = function() {
    var $authModal = $("#authModal");

    var env = optionsService.get('environment', 'production');
    var study = optionsService.get('study', 'api');

    this.error = ko.observable("");
    this.errorClass = ko.observable("");
    this.loading = ko.observable(false);
    this.studyOptions = config.studies;

    this.data = mapping.fromJS({"username":"", "password": "", "study":study});
    this.environment = ko.observable(env);

    this.getRoot = function() {
        return $("#signIn")[0];
    };
    this.showError = function(errorMessage) {
        this.loading(false);
        this.error(errorMessage);
        this.errorClass("error ui message");
    };
    this.hideError = function() {
        this.loading(false);
        this.errorClass("error hidden ui message");
        this.error("");
    };
    this.submitStatus = function() {
        return (this.loading()) ? "ui primary loading button" : "ui primary submit button";
    };
    this.onSessionChange = function(data) {
        if (data == null) {
            // These are interfering with knockout's data binding...
            //$env.dropdown();
            //$study.dropdown();
            this.hideError();
            $authModal.modal('setting', 'closable', false);
            $authModal.modal('show');
        } else {
            $authModal.modal('hide');
        }
    };
    this.onSignIn = function(env, data) {
        if (data.sessionToken) {
            data.environment = env;
            sessionService.startSession(data);
            this.data.username("");
            this.data.password("");
        } else {
            this.onError(data);
        }
    };
    this.forgotPassword = function() {
        this.hideError();
        $authModal.modal('hide');
    };

    // Need a good general-purpose error handler

    this.onError = function(error) {
        console.error("onError arguments", arguments);
        if (error && error.responseJSON) {
            this.showError(error.responseJSON.message);
        } else if (error.message) {
            this.showError(error.message);
        } else /*if (error.status === 0) */{
            this.showError("There has been an error contacting the server.");
        }
    };
    this.signIn = function() {
        if (this.data.username() === "" || this.data.password() === "") {
            return this.showError("Username and/or password are required.");
        }
        this.hideError();
        this.loading(true);

        var env = this.environment();
        optionsService.set('environment', env);
        optionsService.set('study', this.data.study());

        var request = $.jsonPOST(config.signIn(env), mapping.toJS(this.data));
        request.done(this.onSignIn.bind(this, env));
        request.fail(this.onError.bind(this));
    };

    sessionService.addListener(this.onSessionChange.bind(this));
}

var authViewModel = new AuthViewModel();
ko.applyBindings(authViewModel, authViewModel.getRoot());
