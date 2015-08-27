var ko = require('knockout');
var surveyUtils = require('./survey_utils');

var SHOW_DELAY = 200;
var HIDE_DELAY = 800;

ko.bindingHandlers.flipper = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var showTimer = null;
        var hideTimer = null;

        function clearTimers() {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        }

        var obj = ko.unwrap(valueAccessor());
        element.addEventListener('mouseover', function(event) {
            clearTimers();
            showTimer = setTimeout(function() {
                element.classList.add('insertion-control-flipped');
            }, SHOW_DELAY);
            if (viewModel[obj.mouseover]) {
                viewModel[obj.mouseover](element);
            }
        }, false);
        element.addEventListener('mouseout', function(event) {
            clearTimers();
            hideTimer = setTimeout(function() {
                element.classList.remove('insertion-control-flipped');
            }, HIDE_DELAY);
            if (viewModel[obj.mouseout]) {
                viewModel[obj.mouseout](element);
            }
        }, false);
        element.addEventListener('click', function(event) {
            if (event.target.getAttribute('data-type')) {
                event.stopPropagation();
                clearTimers();
                element.classList.remove('insertion-control-flipped');
                if (viewModel[obj.click]) {
                    viewModel[obj.click](event.target.getAttribute('data-type'), ko.unwrap(obj.index));
                }
            }
        }, false);
    }
};

module.exports = function(params) {
    var self = this;

    self.elementsObs = params.elementsObs;
    self.element = params.element;
    self.publishedObs = params.publishedObs;
    self.indexObs = params.indexObs;

    var showTimer = null;
    var hideTimer = null;

    function clearTimers() {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
    }

    self.flipIn = function(event) {
        console.log("flipIn");
    };
    self.flipOut = function(event) {
        console.log("flipout");
    };
    self.clicker = function(type, index) {
        var el = surveyUtils.newElement(type);
        self.elementsObs.splice(index+1,0,el);
    };
};