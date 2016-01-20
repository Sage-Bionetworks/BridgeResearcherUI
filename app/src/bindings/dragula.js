// jquery is loaded globally
var ko = require('knockout');
var dragula = require('dragula');
var autoScroll = require('dom-autoscroller');

ko.bindingHandlers.dragula = {
    init: function(element, valueAccessor) {
        var _item = null;
        var config = ko.unwrap(valueAccessor());

        var drake = dragula([element], {
            direction: 'vertical',
            moves: function(el, container, handle) {
                return typeof config.dragHandleSelector === "undefined" || $(handle).is(config.dragHandleSelector);
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
        }).on('out', function(el, container, source) {
            //drake.cancel(true);
        });
        var scroll = autoScroll([element],{
            margin: 100,
            pixels: 40,
            scrollWhenOutside: true,
            autoScroll: function(){
                return this.down && drake.dragging;
            }
        });
    }
};
