var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');
var serverService = require('../../services/server_service');
var Promise = require('es6-promise').Promise;

var SUBMISSION_SIZE = 100;
var SPLIT_REGEX = /[,\s\t\r\n]+/;

module.exports = function(params) {
    var self = this;
    
    self.importObs = ko.observable("");

    self.doImport = function(vm, event) {
        var identifiers = self.importObs().split(SPLIT_REGEX).filter(function(value) {
            return value.length > 0;
        });
        if (identifiers.length === 0) {
            root.message('error','Some identifiers are required');
            return;
        }
        utils.startHandler(vm, event);
        var submissions = [];
        while (identifiers.length > SUBMISSION_SIZE) {
            submissions.push(identifiers.slice(0,SUBMISSION_SIZE));
            identifiers = identifiers.slice(SUBMISSION_SIZE);
        }
        submissions.push(identifiers);
        
        doSubmission(Promise.resolve(), submissions);
    };
    
    function doSubmission(promise, submissions) {
        if(submissions.length) {
            var submission = submissions.shift();
            
            var p = promise.then(function() {
                serverService.addExternalIds(submission)
                    .then(function() {
                        doSubmission(p, submissions);    
                    }).catch(utils.errorHandler);
            })
        } else {
            promise
                .then(params.vm.closeImportDialog)
                .catch(utils.errorHandler);
        }
    }

    self.close = function(vm, event) {
        root.closeDialog();
    };
}