var $ = require('jquery');
var ko = require('knockout');
var mapping = require('knockout-mapping');
var config = require('../config');
var optionsService = require('../services/options_service');
var serverService = require('../services/server_service');

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
    this.onSessionStart = function(data) {
        $authModal.modal('hide');
    };
    this.onSessionEnd = function(data) {
        this.hideError();
        $authModal.modal('setting', 'closable', false);
        $authModal.modal('show');
    };
    this.onSignIn = function(env, data) {
        if (data.sessionToken) {
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

        var request = serverService.signIn(env, mapping.toJS(this.data));
        request.then(this.onSignIn.bind(this, env));
        request.catch(this.onError.bind(this));
    };

    serverService.addSessionStartListener(this.onSessionStart.bind(this));
    serverService.addSessionEndListener(this.onSessionEnd.bind(this));
}

var authViewModel = new AuthViewModel();
ko.applyBindings(authViewModel, authViewModel.getRoot());
