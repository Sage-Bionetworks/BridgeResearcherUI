var ko = require('knockout');
var root = require('../../root');
var utils = require('../../utils');
var serverService = require('../../services/server_service');
var Promise = require('es6-promise').Promise;

var SUBMISSION_SIZE = 5;
var SUBMISSION_DELAY = 1000;
var SPLIT_REGEX = /[,\s\t\r\n]+/;

function createQueue(identifiers) {
    var queue = [];
    while (identifiers.length > SUBMISSION_SIZE) {
        queue.push(identifiers.slice(0,SUBMISSION_SIZE));
        identifiers = identifiers.slice(SUBMISSION_SIZE);
    }
    queue.push(identifiers);
    return queue;    
}

function getPerc(step, max) {
    var perc = ((step/max)*100).toFixed(0);
    if (perc > 100) { perc = 100; }
    return perc + "%";
}

module.exports = function(params) {
    var self = this;
    
    var cancel = false;
    self.importObs = ko.observable("");
    self.valueObs = ko.observable(0);
    self.maxObs = ko.observable(0);
    self.percentageObs = ko.observable("0%");
    self.statusObs = ko.observable("Please enter a list of identifiers, separated by commas or new lines. ");

    self.doImport = function(vm, event) {
        var identifiers = self.importObs().split(SPLIT_REGEX).filter(function(value) {
            return value.length > 0;
        });
        if (identifiers.length === 0) {
            root.message('error','You must enter some identifiers.');
            return;
        }
        
        utils.startHandler(vm, event);
        var queue = createQueue(identifiers);
        self.valueObs(0);
        self.maxObs(queue.length);
        
        doSubmission(Promise.resolve(), queue, 0)
            .then(utils.successHandler(vm, event))
            .catch(utils.failureHandler(vm, event));
    };
    
    function doSubmission(promise, queue, step) {
        if (cancel) { return promise; }
        
        if(queue.length) {
            var submission = queue.shift();
            var p = promise.then(function() {
                if (cancel) { return; }
                serverService.addExternalIds(submission).then(function() {
                    self.valueObs(step);
                    self.percentageObs(getPerc(step, self.maxObs()));
                    setTimeout(function() {
                        doSubmission(p, queue, ++step);
                    }, SUBMISSION_DELAY);
                });
            });
            return p;
        } else {
            return promise.then(function() {
                self.percentageObs("100%");
                self.statusObs("External IDs imported.")
                self.valueObs(self.maxObs());
            });
        }
    }

    self.close = function(vm, event) {
        cancel = true;
        root.closeDialog();
    };
}