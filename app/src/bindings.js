// jquery and semantic-ui are loaded globally (for now) from CDNs.
var ko = require('knockout');
require('knockout-postbox');
var $ = require('jquery');

// need to make a global out of this for semantic to work, as it's not in a package.
// This is hacky, webpack has better support for this. Worse, semantic is a jQuery
// plugin and adds no globals that webpack can convert to modules.
window.$ = window.jQuery = $;
require('../lib/semantic'); // we reference it here.

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

            function updateOnMatch(newValue) {
                console.log("updateOnMatch", input.value, newValue);
                if (input.value === newValue) {
                    input.checked = true;
                    $element.addClass("checked");
                }
            }
            observer.subscribe(updateOnMatch);
            updateOnMatch(observer());

            $element.addClass("ui radio checkbox").on('click', function() {
                if (!input.disabled) {
                    observer(input.value);
                    //$element.addClass("checked");
                }
            });
        } else if (value === 'dropdown') {
            $element.addClass("ui dropdown").dropdown();
        } else if (value === 'popup') {
            $element.popup();
        } else if (value === 'popup-menu') {
            $element.popup({on: 'click', hideOnScroll:true, position: 'left center', duration: 100});
        } else if (value === 'adjacent-popup') {
            $element.popup({inline:true});
        } else if (value === 'multi-search-select') {
            // Every single bit of this nightmare is required on either the subpopulation or the 
            // scheduleCriteria object to load and save properly.
            setTimeout(function() {
                var collectionObs = allBindings().updateSelect;
                $element.addClass("ui fluid search dropdown").attr("multiple","true").dropdown({
                    onAdd: function(value) {
                        if (!collectionObs.contains(value)) {
                            collectionObs.push(value);    
                        }
                    },
                    onRemove: function(value) {
                        collectionObs.remove(value);
                    }
                });
                $element.dropdown("set selected", collectionObs());
                collectionObs.subscribe(function(newValue) {
                    $element.dropdown("set selected", newValue);
                });
            },1);
        }
    }
};
ko.bindingHandlers.selected = {
    init: function(element, valueAccessor) {
        var value = ko.unwrap(valueAccessor());
        if (value) {
            element.setAttribute("selected","selected");
        }
    }  
};
ko.bindingHandlers.ckeditor = {
    init: function(element, valueAccessor) {
        if (!CKEDITOR) {
            throw new Error("CK editor has not been loaded in the page");
        }
        var id = element.getAttribute("id");
        var config = {
            height: "25rem",
            resize_dir: "vertical",
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
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            if (CKEDITOR.instances[id]) {
                CKEDITOR.remove(CKEDITOR.instances[id]);
            };
        });
    }
};
ko.bindingHandlers.modal = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        ko.bindingHandlers.component.init(element, valueAccessor, allBindings, viewModel, bindingContext);
        var observable = valueAccessor();
        observable.subscribe(function (newConfig) {
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
                itemsObs.remove(rowItem);
                $element.remove();
            }
        });
    }
};
