var utils = require('../../utils');
var serverService = require('../../services/server_service');
var storeService = require('../../services/store_service');
var config = require('../../config');
var root = require('../../root');
var bind = require('../../binder');

module.exports = function() {
    var self = this;
    var isLocked = utils.isDefined(root.queryParams.study);
    
    var studyKey, env;    
    if (isLocked) {
        studyKey = root.queryParams.study;
        env = 'production';
    } else {
        studyKey = storeService.get('studyKey') || 'api';
        env = storeService.get('environment') || 'production';
    }
    bind(self)
        .obs('email')
        .obs('title')
        .obs('study', studyKey)
        .obs('environment', env)
        .obs('studyOptions[]')
        .obs('isLocked', isLocked);

    self.environmentOptions = config.environments;
    self.environmentObs.subscribe(function(newValue) {
        self.studyOptionsObs({name:'Updating...',identifier:''});
        loadStudyList(newValue);
    });
    loadStudyList(env);
    
    function loadStudies(studies){
        self.studyOptionsObs(studies.items);
        self.studyObs(studyKey);
        if (self.isLockedObs()) {
            self.titleObs(utils.findStudyName(self.studyOptionsObs(), studyKey));
        }
    }
    
    function loadStudyList(newValue) {
        serverService.getStudyList(newValue)
            .then(loadStudies)
            .catch(utils.failureHandler());
    }

    self.sendResetPasswordRequest = function(vm, event) {
        if (self.emailObs() === "") {
            root.message('error', "Email address is required.");
            return;
        }
        storeService.set('environment', self.environmentObs());
        storeService.set('studyKey', self.studyObs());

        utils.startHandler(self, event);
        serverService.requestResetPassword(self.environmentObs(), {
            email: self.emailObs(), study: self.studyObs()
        })
        .then(function() {
            root.openDialog('sign_in_dialog');
        })
        .then(utils.successHandler(self, event, "An email has been sent to that address with instructions on changing your password."))
        .catch(utils.dialogFailureHandler(vm, event));
    };
    self.cancel = function() {
        root.openDialog('sign_in_dialog');
    };
};