var ko = require('knockout');
var $ = require('jquery');

var SHOW_DELAY = 1;
var HIDE_DELAY = 800;

// http://stackoverflow.com/questions/23606541/observable-array-push-multiple-objects-in-knockout-js
ko.observableArray.fn.pushAll = function(valuesToPush) {
    var underlyingArray = this();
    this.valueWillMutate();
    ko.utils.arrayPushAll(underlyingArray, valuesToPush);
    this.valueHasMutated();
    return this;
};
ko.observableArray.fn.contains = function(value) {
    var underlyingArray = this();
    return underlyingArray.indexOf(value) > -1;
};
ko.bindingHandlers.semantic = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = ko.unwrap(valueAccessor());
        if (value === 'checkbox') {
            element.className += " ui checkbox";
            var observer = allBindings().checkboxObs;
            var input = $(element).children("input[type=checkbox]").get(0);
            $(element).on('click', function() {
                if (!input.disabled) {
                    observer(!observer());
                    element.classList.toggle("checked", observer());
                }
            });
        } else if (value === 'dropdown') {
            element.className += " ui dropdown";
            $(element).dropdown();
        }
    }
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
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        ko.bindingHandlers.component.init(element, valueAccessor, allBindings, viewModel, bindingContext);
        var config = valueAccessor();
        config.extend({notify: 'always'}); // Even if the user opens an identical dialog, reopen it.
        config.subscribe(function (newConfig) {
            var $modal = $(element).children(".modal");
            if ($modal.modal) {
                $modal.modal({"closable": false});
                if (newConfig.name !== "none_dialog") {
                    $modal.modal('show');
                } else {
                    $modal.modal('hide');
                }
            }
        });
    }
};
/**
 * Create an auto-resizing textarea control without going insane. Unfortunately this
 * solution requires CSS as well, see survey.css where this is currently used.
 *
 * http://www.brianchu.com/blog/2013/11/02/creating-an-auto-growing-text-input/
 */
ko.bindingHandlers.resizeTextArea = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var textareaSize = element.querySelector('.textarea-size');
        var textarea = element.querySelector('textarea');
        var autoSize = function () {
            textareaSize.innerHTML = textarea.value.trim() + '\n';
        };
        textarea.addEventListener('input', autoSize, false);
        setTimeout(autoSize, 200);
    }
};
/**
 * Creates that flippy insertion control in the survey editor.
 *
 */
ko.bindingHandlers.flipper = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var showTimer = null;
        var hideTimer = null;

        function clearTimers() {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        }

        var obj = ko.unwrap(valueAccessor());
        element.addEventListener('click', function(event) {
            clearTimers();
            showTimer = setTimeout(function() {
                element.classList.add('insertion-control-flipped');
            }, SHOW_DELAY);
            if (viewModel[obj.mouseover]) {
                viewModel[obj.mouseover](element);
            }
        }, false);
        element.addEventListener('mouseover', function(event) {
            clearTimers();
            hideTimer = setTimeout(function() {
                element.classList.remove('insertion-control-flipped');
            }, HIDE_DELAY);
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
/*
function getCaretPosition(field) {
    var pos = 0;

    if (document.selection) {
        field.focus();
        var sel = document.selection.createRange();
        sel.moveStart ('character', -field.value.length);
        pos = sel.text.length;
    } else if (field.selectionStart || field.selectionStart == '0') {
        pos = field.selectionStart;
    }
    return (pos);
}

var DATE_PATTERN = [/\d/,/\d/,/\d/,/\d/,/-/,/\d/,/\d/,/-/,/\d/,/\d/];
var DATETIME_PATTERN = DATE_PATTERN.concat([/\s/,/\d/,/\d/,/\:/,/\d/,/\d/,/\s/,/[apAP]/,/[mM]/]);

function patternCreator(element, pattern) {
    return function(event) {
        if (!event.altKey && !event.metaKey) {
            var ch = String.fromCharCode(event.keyCode);
            var string = element.value + ch;
            var subPattern = pattern[string.length-1];
            if (string.length > pattern.length || !subPattern.test(ch)) {
                event.preventDefault();
            }
        }
    };
};
ko.bindingHandlers.date = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (element.type === "text") {
            element.addEventListener("keypress", patternCreator(element, DATE_PATTERN), false);
        }
    }
};
ko.bindingHandlers.datetime = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        if (element.type === "text") {
            element.addEventListener("keypress", patternCreator(element, DATETIME_PATTERN), false);
        }
    }
};
*/