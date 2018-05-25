import '../../node_modules/flatpickr/dist/flatpickr.min.css';
import $ from 'jquery';
import alert from './widgets/alerts';
import Chart from 'chart.js';
import flatpickr from 'flatpickr';
import ko from 'knockout';
import RootViewModel from './root';

// need to make a global out of this for semantic to work, as it's not in a package.
// This is hacky, webpack has better support for this. Worse, semantic is a jQuery
// plugin and adds no globals that webpack can convert to modules.
window.$ = window.jQuery = $;

// http://stackoverflow.com/questions/23606541/observable-array-push-multiple-objects-in-knockout-js
ko.observableArray.fn.pushAll = function(valuesToPush) {
    this.valueWillMutate();
    ko.utils.arrayPushAll(this(), valuesToPush);
    this.valueHasMutated();
    return this;
};
ko.observableArray.fn.contains = function(value) {
    return this().indexOf(value) > -1;
};

ko.bindingHandlers.chart = {
    init: function(element, valueAccessor) {
        let context = element.getContext("2d");
        let observer = valueAccessor();
        observer.subscribe(function(config) {
            if (element._chart) {
                element._chart.destroy();
            }
            element._chart = new Chart(context, config);
        });
    }
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

ko.bindingHandlers.range = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        element.classList.add('range');

        let input = element.querySelector("input");
        let config = valueAccessor();
        let startDateObs = config.startDateObs;
        let endDateObs = config.endDateObs;
        let onChange = config.onChange || function() {};

        function updateObservers(dates) {
            startDateObs(null);
            endDateObs(null);
            if (dates && dates.length) {
                startDateObs(dates[0]);
                endDateObs(dates[1]);
            }
            onChange();
        }
        let f = flatpickr(input, { onChange: updateObservers, mode: 'range', clickOpens: true,
            defaultDate: [startDateObs(), endDateObs()], enableTime: false,
            altInput: true, altFormat: "F j, Y", dateFormat: "Y-m-d" });

        // control now does not close when you enter delete key, this fixes, but is not ideal
        element.parentNode.addEventListener('keydown', function(e) {
            if (e.keyCode === 8) {
                setTimeout(f.close, 100);
            }
        }, true);
    }
};

ko.bindingHandlers.flatpickr = {
    init: function(element, valueAccessor, allBindings) {
        let observer = valueAccessor();
        let onChange = allBindings().onChange || function() {};
        let includeTime = element.hasAttribute("data-enableTime");
        let _init = false;

        function setInstance() {
            if (_init) { return; }
            _init = true;
            instance.close();
        }

        let instance = flatpickr(element, { defaultDate: observer(), 
            onChange: updateObserver, enableTime: includeTime, onOpen: setInstance });

        function updateObserver(dates) {
            observer(null);
            if (dates && dates.length) {
                observer(dates[0]);
            }
            onChange();
        }
    }
};

ko.bindingHandlers.condPopup = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        let data = bindingContext.$data;
        let object = ko.unwrap(valueAccessor());
        if (object.render(data)) {
            element.setAttribute('data-variation', 'very wide');
            element.setAttribute('data-html', object.html(data));
            $(element).popup();
        }
        let className = object.className(data);
        if (letlassName) {
            element.classList.add(object.className(data));
        }
    }
};
ko.bindingHandlers.selected = {
    init: function(element, valueAccessor) {
        let value = ko.unwrap(valueAccessor());
        if (value) {
            element.setAttribute("selected","selected");
        }
    }  
};
ko.bindingHandlers.readonly = {
    init: function(element, valueAccessor) {
        let observer = valueAccessor();
        observer.subscribe(function(value) {
            if (value) {
                element.setAttribute("readonly","readonly");
            } else {
                element.removeAttribute("readonly");
            }
        });
    }
};

ko.bindingHandlers.ckeditor = {
    init: function(element, valueAccessor) {
        if (!CKEDITOR) {
            throw new Error("CK editor has not been loaded in the page");
        }
        CKEDITOR.on('dialogDefinition', function(event) {
            if (['image','table','link'].indexOf( event.data.name ) > -1) {
                let dialogDefinition = event.data.definition;
                dialogDefinition.removeContents('Link');
                dialogDefinition.removeContents('advanced');
            }
        });
        let id = element.getAttribute("id");
        let config = {
            height: "25rem",
            resize_dir: "vertical",
            on: {
                instanceReady: function(event) {
                    let callback = valueAccessor();
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
        let observable = valueAccessor();
        let $modal = null;
        observable.subscribe(function(newConfig, params) {
            let closeable = (newConfig.params && typeof newConfig.params.closeable !== "undefined") ?
                newConfig.params.closeable : true;
            
            if (newConfig.name !== "none") {
                if ($modal) {
                    $modal.empty();
                }
                $modal = $(".ui.modal")
                    .modal({closable: closeable, notify: 'always'})
                    .modal("show");
            } else {
                $modal.modal('hide');
            }
        });
    }
};
ko.bindingHandlers.editableDiv = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        let observer = valueAccessor();
        element.innerText = observer() || '';
        element.addEventListener('keyup', function() {
            observer(element.innerText);
        }, false);
    }
};
ko.bindingHandlers.submitByButton = {
    init: function(element, valueAccessor) {
        let buttonId = ko.unwrap(valueAccessor());
        let button = document.getElementById(buttonId);
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
    // If the observer is passed in directly, just return that.
    if (typeof collName !== 'string') {
        return collName;
    }
    for (let i = 0; i < context.$parents.length; i++) {
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
        let config = ko.unwrap(valueAccessor());
        let selector = config.selector;
        let rowItem = config.object;
        let collName = config.collection || 'itemsObs';
        let context = ko.contextFor(element);
        let itemsObs = findItemsObs(context, collName);
        let $element = $(element).closest(selector);
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

ko.bindingHandlers.tab = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        let tab = element.getAttribute('data-tab');
        updateElement(element, valueAccessor, function(element, value) {
            element.classList.toggle("active", value === tab);
        });
    }
};

function updateTabSelection(element) {
    let hash = document.location.hash;
    let href = element.getAttribute('href');
    let tabPostFix = (href) ? ("/" + href.split("/").pop()) : href;
    element.classList.toggle("active", hash.indexOf(tabPostFix) > -1);
}

ko.bindingHandlers.tabber = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        element.classList.add("item");
        updateTabSelection(element);

        let observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === "href") {
                    updateTabSelection(element);            
                }
            });
        });
        observer.observe(element, {attributes: true});
    }
};

ko.bindingHandlers.href = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        updateElement(element, valueAccessor, function(element, value) {
            element.setAttribute('href', value);
        });
    }
};

ko.bindingHandlers.returnHandler = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        let func = valueAccessor();
        element.addEventListener("keydown", function(event) {
            if (event.keyCode === 13) {
                func(event);
                return false;
            }
            return true;
        });
    }
};


function updateElement(element, valueAccessor, func) {
    let accessor = valueAccessor();
    if (ko.isObservable(accessor) || ko.isComputed(accessor)) {
        func(element, accessor());
        accessor.subscribe(function(newValue) {
            func(element, newValue);
        });
    } else {
        func(element, accessor);
    }        
}
