var ko = require('knockout');
var $ = require('jquery');
var dragula = require('dragula');
//var SHOW_DELAY = 1;
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

ko.bindingHandlers.dragula = {
    init: function(element, valueAccessor) {
        var _item = null;
        var config = ko.unwrap(valueAccessor());

        dragula([element], {
            direction: 'vertical',
            moves: function (el, container, handle) {
                return $(handle).is(config.dragHandleSelector);
            }
        }).on('drop', function(el, zone) {
            var elements = element.querySelectorAll(config.elementSelector);
            // This utility handles node lists
            var index = ko.utils.arrayIndexOf(elements, el);
            var data = ko.contextFor(el).$data;
            config.listObs.remove(data);
            config.listObs.splice(index,0,data);
            if (_item) {
                _item.parentNode.removeChild(_item);
                _item = null;
            }
        }).on('cloned', function(mirror, item, type) {
            _item = item;
        });
    }
};

ko.bindingHandlers.semantic = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = ko.unwrap(valueAccessor());
        var $element = $(element);
        if (value === 'checkbox') {
            var input = $element.children("input[type=checkbox]").get(0);
            var observer = allBindings().checkboxObs;
            $element.addClass("ui checkbox").on('click', function() {
                if (!input.disabled) {
                    observer(!observer());
                    $element.toggleClass('checked', observer());
                }
            });
        } else if (value === 'radio') {
            var input = $element.children("input[type=radio]").get(0);
            var observer = allBindings().radioObs;
            observer.subscribe(function(newValue) {
                if (newValue === input.value) {
                    input.checked = true;
                    $element.addClass("checked");
                }
            });
            if (observer() === input.value) {
                input.checked = true;
                $element.addClass("checked");
            }
            $element.addClass("ui radio checkbox").on('click', function() {
                if (!input.disabled) {
                    observer(input.value);
                    $element.addClass("checked");
                }
            }).checkbox();
        } else if (value === 'dropdown') {
            $element.addClass("ui dropdown").dropdown();
        } else if (value === 'popup') {
            $element.popup();
        }
    }
};
ko.bindingHandlers.ckeditor = {
    init: function(element, valueAccessor) {
        if (!CKEDITOR) {
            throw new Error("CK editor has not been loaded in the page");
        }
        var config = {
            height: "25rem",
            toolbarGroups: [
                { name: 'clipboard', groups: ['clipboard','undo']},
                {"name":"basicstyles","groups":["basicstyles"]},
                {"name":"paragraph","groups":["indent","align","list","blocks"]},
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
        var observable = valueAccessor();
        observable.subscribe(function (newConfig) {
            //var $modal = $(element).children(".modal");
            var $modal = $(".ui.modal");
            if ($modal.modal) {
                if (newConfig.name !== "none") {
                    $modal.modal({"closable": false, "detachable": false, "notify": 'always'});
                    $modal.modal('show');
                } else {
                    $modal.modal('hide');
                }
            }
        });
    }
};
ko.bindingHandlers.editableDiv = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var observer = valueAccessor();
        element.textContent = observer();
        element.addEventListener('keydown', function(e) {
            if (e.keyCode === 13){
                e.preventDefault();
            }
        }, false);
        element.addEventListener('keyup', function() {
            observer(element.textContent);
        }, false);
    }
};

function findItemsObs(context, collName) {
    for (var i = 0; i < context.$parents.length; i++) {
        if (context.$parents[i][collName]) {
            if (context.$parents[i][collName]) {
                return context.$parents[i][collName];
            }
        }
    }
    return null;
}

/**
 * Fade and remove element in a list. The binding has the following parameters, passed in through a
 * parameter object:
 *  selector {String}
 *      the selector to find the encompassing HTML element that represents a single item in this
 *          observable array
 *  object {Object}
 *      the actual object to remove from the observable array
 *  collection {String}
 *      the name of the collection on a viewModel in the hierachy for this element. Defaults to 'itemsObs'
 *
 *  This binding assumes a transition that lasts 500ms.
 */
ko.bindingHandlers.fadeRemove = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var config = ko.unwrap(valueAccessor());
        var selector = config.selector;
        var rowItem = config.object;
        var collName = config.collection || 'itemsObs';
        var context = ko.contextFor(element);
        var itemsObs = findItemsObs(context, collName);
        var $element = $(element).closest(selector);

        element.addEventListener('click', function(event) {
            event.preventDefault();
            if (confirm("Are you sure?")) {
                $element.css("max-height","0px");
                setTimeout(function() {
                    itemsObs.remove(rowItem);
                    $element.remove();
                },510); // waiting for animation to complete
            }
        });
    }
};
/**
 * Creates that flippy insertion control in the survey editor.
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
            element.classList.add('insertion-control-flipped');/*
            showTimer = setTimeout(function() {

            }, SHOW_DELAY);*/
            if (viewModel[obj.mouseover]) {
                viewModel[obj.mouseover](element);
            }
        }, false);
        element.addEventListener('mouseover', clearTimers, false);
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
