// jquery loaded globally (for now) from CDNs.
var ko = require('knockout');
var $ = require('jquery');
var flatpickr = require('flatpickr');
require('../../node_modules/flatpickr/dist/flatpickr.min.css');
var alert = require('./widgets/alerts');
var fn = require('./transforms');

// need to make a global out of this for semantic to work, as it's not in a package.
// This is hacky, webpack has better support for this. Worse, semantic is a jQuery
// plugin and adds no globals that webpack can convert to modules.
window.$ = window.jQuery = $;

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

ko.bindingHandlers.focusable = {
    init: function(element) {
        $(element).find('input').on('focus', function() {
            element.classList.add("range-control-border-active");
        }).on('blur', function() {
            element.classList.remove("range-control-border-active");
        });
    }
};
ko.bindingHandlers.flatpickr = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var observer = valueAccessor();
        var timeout = allBindings().timeout;
        var onChange = allBindings().onChange || function() {};
        var wrap = (allBindings().wrap === true);
        var includeTime = element.hasAttribute("data-enableTime");
        var input = element.querySelector("input");

        function updateObserver(date) {
            observer(null);
            if (date) {
                observer(fn.formatLocalDate(date, "00:00:00.000"));
            }/* else {
                observer(null);
            }*/
            onChange();
        }
        function createPicker() {
            //var d = (observer()) ? new Date(observer()) : null;
            flatpickr(element, {/*defaultDate: d, */onChange: updateObserver, wrap: wrap, clickOpens: !wrap});
            /*
            if (d) {
                element.value = d[includeTime ? "toLocaleString" : "toLocaleDateString"]();
            }*/
        }
        // You must delay initialization in a modal until after the modal is open, or 
        // the picker works... but spontaneously opens. Just add timeout: 600 to the 
        // binding, or however long you want to delay.
        if (timeout) {
            setTimeout(createPicker, timeout);    
        } else {
            createPicker();
        }
    }
};

ko.bindingHandlers.condPopup = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var data = bindingContext.$data;
        var object = ko.unwrap(valueAccessor());
        if (object.render(data)) {
            element.setAttribute('data-variation', 'very wide');
            element.setAttribute('data-html', object.html(data));
            $(element).popup();
        }
        var className = object.className(data);
        if (className) {
            element.classList.add(object.className(data));
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
        CKEDITOR.on('dialogDefinition', function(event) {
            if (['image','table','link'].indexOf( event.data.name ) > -1) {
                var dialogDefinition = event.data.definition;
                dialogDefinition.removeContents('Link');
                dialogDefinition.removeContents('advanced');
            }
        });
        var id = element.getAttribute("id");
        var config = {
            height: "25rem",
            resize_dir: "vertical",
            on: {
                instanceReady: function(event) {
                    var callback = valueAccessor();
                    callback(event.editor);
                }
            },
            toolbar: [
                { name: 'clipboard', items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
                { name: 'editing', items: [ 'Find', 'Replace', '-', 'SelectAll' ] },
                { name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat' ] },
                { name: 'links', items: [ 'Link', 'Unlink', 'Anchor' ] },
                { name: 'insert', items: [ 'Image', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar' ] },
                { name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock' ] },
                { name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] },
                { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
                { name: 'document', items: ['-', 'Source']}
            ]            
        };
        CKEDITOR.replace(element, config);
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            if (CKEDITOR.instances[id]) {
                CKEDITOR.remove(CKEDITOR.instances[id]);
            }
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
                    $modal.modal({closable: false, detachable: false, notify: 'always', observeChanges: true});
                    $modal.modal("show");
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
        element.innerText = observer() || '';
        element.addEventListener('keyup', function() {
            observer(element.innerText);
        }, false);
    }
};
ko.bindingHandlers.submitByButton = {
    init: function(element, valueAccessor) {
        var buttonId = ko.unwrap(valueAccessor());
        var button = document.getElementById(buttonId);
        if (!button) {
            console.error("Could not find button #" + buttonId);
        }
        element.onsubmit = function(event) {
            event.preventDefault();
            button.click();
        };
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
            alert.deleteConfirmation("Are you sure you want to delete this?", function() {
                $element.animate({height: '0px', minHeight: '0px'}, 300, 'swing', function() {
                    itemsObs.remove(rowItem);
                    $element.remove();
                });
            });
        });
    }
};

function activeHandler(element, valueAccessor) {
    var id = element.getAttribute("href");
    if (id) {
        id = id.replace('#/','');
    }
    var func = valueAccessor;
    do {
        func = func(id);
    } while(typeof func === "function");
    element.classList.toggle("active", func);
}

ko.bindingHandlers.active = {
    init: activeHandler,
    update: activeHandler
};
