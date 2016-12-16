// jquery is loaded globally
var ko = require('knockout');
var dragula = require('dragula');
var autoScroll = require('dom-autoscroller');
require('knockout-postbox');

var indexOf = [].indexOf;

ko.bindingHandlers.dragula = {
    init: function(element, valueAccessor) {
        var config = ko.unwrap(valueAccessor());

        var drake = dragula([element], {
            removeOnSpill: false,
            direction: 'vertical',
            moves: function(el, container, handle) {
                return typeof config.dragHandleSelector === "undefined" ||
                       handle.classList.contains(config.dragHandleSelector.replace(".",""));
            }
        })
        .on('drop', function(el, zone) {
            var data = ko.contextFor(el).$data;
            var index = indexOf.call(zone.children, el);

            // Despite the fact that we're manipulating the array this way, it still
            // recreates all the HTML of all the list items... It may be because the 
            // list is bound to two different sections of HTML, I'm not sure. On schedule
            // pages this wipes out the schedule component embedded in the scheduleCriteria/
            // scheduleGroup arrays.
            el.parentNode.removeChild(el); 
            config.listObs.remove(data);
            config.listObs.splice(index,0,data);
            config.indexObs(index);
        });
        autoScroll([element],{
            margin: 100,
            pixels: 40,
            scrollWhenOutside: true,
            autoScroll: function(){
                return this.down && drake.dragging;
            }
        });
    }
};
