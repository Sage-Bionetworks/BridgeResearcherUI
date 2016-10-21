var ko = require('knockout');
require('../../lib/semantic-2.2.min'); // we reference it here.

var handlers = {
    'progress': function($element, allBindings) {
        $element.addClass("ui tiny progress");
        var dataValue = allBindings().attr["data-value"];
        console.log(dataValue);
        if (dataValue === "3") {
            $element.addClass("green");
        }

        $element.progress();
    },
    'checkbox': function($element, allBindings) {
        var input = $element.children("input[type=checkbox]").get(0);
        var observer = allBindings().checkboxObs;
        $element.addClass("ui checkbox").on('click', function() {
            if (!input.disabled) {
                observer(!observer());
                $element.toggleClass('checked', observer());
            }
        });
    },
    'search': function($element, allBindings) {
        var source = allBindings().source;
        var observer = allBindings().observer;
        var input = $element.children("input.prompt");
        $element.addClass("ui search").search({source:source, onSelect: function(object) {
            input.trigger('selectedItem', object);
            observer(object.title);
        }});        
    },
    // TODO: Does this direct binding of an observer fix anything outside of changing constraints?
    'dropdown': function($element, allBindings) {
        var params = {action:'activate'};
        var dropdownChange = allBindings().dropdownChange;
        if (dropdownChange) {
            params.onChange = function(value, text, $selectedItem) {
                dropdownChange($selectedItem.get(0));
            };
        }
        setTimeout(function() {
            $element.addClass("ui dropdown").dropdown(params);
        },0);
    },
    'dropdown-button': function($element) {
        $element.addClass("ui small button dropdown")
            .dropdown({action: 'hide'});
    },
    'popup': function($element) {
        $element.popup();
    },
    'adjacent-popup': function($element) {
        $element.popup({inline:true});
    },
    'popup-menu': function($element) {
        $element.popup({
            on: 'click', 
            hideOnScroll:true, 
            position: 'left center', 
            duration: 100
        });        
    },
    'multi-search-select': function($element, allBindings) {
        var collectionObs = allBindings().updateSelect;
        var intervalId = setInterval(init, 100);

        function init() {
            var allOptionsObs = allBindings().foreach;
            if (allOptionsObs() instanceof Array) {
                clearTimeout(intervalId);
                
                $element.dropdown("set selected", collectionObs());
                collectionObs.subscribe(function(newValue) {
                    $element.dropdown("set selected", newValue);
                });
            } else {
                console.log("polling");
            }
        }        
        
        $element.addClass("ui selection dropdown").dropdown({
            onAdd: function(value) {
                if (!collectionObs.contains(value)) {
                    collectionObs.push(value);    
                }
            },
            onRemove: function(value) {
                collectionObs.remove(value);
            }
        });
    },
    'radio': function($element, allBindings) {
        var input = $element.children("input[type=radio]").get(0);
        var observer = allBindings().radioObs;

        function updateOnMatch(newValue) {
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
                $element.addClass("checked");
            }
        });        
    }
};

ko.bindingHandlers.semantic = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = ko.unwrap(valueAccessor());
        if (handlers[value]) {
            handlers[value]($(element), allBindings);
        } else {
            throw new Error("Semantic binding not found: " + value);
        }
    }
};
