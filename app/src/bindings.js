var ko = require('knockout');
var $ = require('jquery');

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
// No event notification to subscribers that this has changed. Useful for integration with Dragula
ko.observableArray.fn.removeQuietly = function(value) {
    var underlyingArray = this();
    ko.utils.arrayRemoveItem(underlyingArray, value);
}
// No event notification to subscribers that this has changed. Useful for integration with Dragula
ko.observableArray.fn.insertQuietly = function(value, index) {
    var underlyingArray = this();
    underlyingArray.splice(index,0,value);
}
ko.bindingHandlers.semantic = {
    init: function(element, valueAccessor) {
        var value = ko.unwrap(valueAccessor());
        if (value === 'checkbox') {
            element.classList.add("ui");
            element.classList.add("checkbox");
            $(element).checkbox();
        } else if (value === 'dropdown') {
            element.classList.add("ui");
            element.classList.add("dropdown");
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
