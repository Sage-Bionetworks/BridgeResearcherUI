var utils = require('../../utils');
var ko = require('knockout');
var hash = require('object-hash');
var dragula = require('dragula');

function ListsSource(survey, element) {
    this.currentListEntry = null;
    this.listSet = [];
    var md5s = {};
    survey.elements.forEach(function(anElement) {
        var enumeration = getEnumeration(anElement);
        if (enumeration) {
            var entry = makeListMapEntry(enumeration);
            if (!md5s[entry.md5]) {
                md5s[entry.md5] = entry;
            } else {
                md5s[entry.md5].occurrences++;
            }
            if (anElement === element) {
                this.currentListEntry = entry;
            }
        }
    }, this);
    for (var key in md5s) {
        this.listSet.push(md5s[key]);
    }
    this.listSet.sort(function(a,b) {
        return a.name.localeCompare(b.name);
    });
}
ListsSource.prototype = {
    getAllLists: function() {
        return this.listSet;
    },
    getCurrentEntry: function() {
        return this.currentListEntry;
    },
    setCurrentEntry: function(entry) {
        this.currentListEntry = entry;
    }
}

function makeListMapEntry(enumeration) {
    var name = "<empty>";
    if (enumeration.length === 1) {
        name = itemLabel(enumeration[0]);
    } else if (enumeration.length == 2) {
        name = itemLabel(enumeration[0]) + " / " + itemLabel(enumeration[enumeration.length-1]);
    } else if (enumeration.length > 2) {
        name = itemLabel(enumeration[0]) + " to " + itemLabel(enumeration[enumeration.length-1]);
    }
    // tediously, knockout.js fails when there's no detail property
    enumeration.forEach(function(item) {
        item.detail = item.detail || null;
    });
    return {name: name, md5: hash.MD5(enumeration), enumeration: enumeration, occurrences: 1};
}

function itemLabel(item) {
    return (item.detail) ? ("<b>"+item.label+"</b>&mdash;"+item.detail) : ("<b>"+item.label+"</b>");
}

function copyEntry(element, entry) {
    element.constraints.enumeration = entry.enumeration;
}

function getEnumeration(element) {
    return (element.constraints && element.constraints.enumeration) ? element.constraints.enumeration : null;
}

module.exports = function(params) {
    var self = this;

    var parent = params.parentViewModel;
    self.surveyObs = parent.surveyObs;
    self.element = parent.element;
    self.publishedObs = parent.publishedObs;

    self.labelObs = ko.observable();
    self.detailObs = ko.observable();
    self.valueObs = ko.observable();

    // Should we copy edits over to all the same lists...
    self.copyObs = ko.observable(true);

    var listsSource = new ListsSource(self.surveyObs(), self.element);
    self.allLists = ko.observableArray(listsSource.getAllLists());
    self.list = ko.observableArray(listsSource.getCurrentEntry().enumeration);

    var zonesEl = document.querySelector(".zones");

    self.hasDetail = function(item) {
        return !!item.detail;
    };
    self.removeListItem = function(listItem) {
        self.list.remove(listItem);
    };
    self.toggleCopyObs = function() {
        self.copyObs(!self.copyObs());
    };
    self.selectList = function(entry, event) {
        ko.utils.emptyDomNode(zonesEl);
        self.list(entry.enumeration);
        listsSource.setCurrentEntry(entry);
        self.currentTabObs('editor');
    };
    self.addListItem = function() {
        var label = self.labelObs();
        if (label !== "") {
            var value = self.valueObs() || label;
            var item = {label: label, value: value};
            if (self.detailObs()) {
                item.detail = self.detailObs();
            }
            self.list.push(item);
        }
        self.labelObs("");
        self.detailObs("");
        self.valueObs("");
    };
    self.saveList = function() {
        var entry = listsSource.getCurrentEntry();
        entry.enumeration = self.list();

        // We're looking for lists on other elements that were similar to the list before
        // the user started editing it, so we want the original MD5 before it gets
        // recalculated
        var oldMD5 = entry.md5;

        copyEntry(self.element, entry);
        if (self.copyObs()) {
            self.surveyObs().elements.forEach(function (element) {
                var enumeration = getEnumeration(element);
                if (enumeration && hash.MD5(enumeration) === oldMD5) {
                    copyEntry(element, entry);
                }
            });
        }
        parent.enumerationObs(entry.enumeration);
        utils.closeDialog();
    };
    self.cancel = function() {
        utils.closeDialog();
    };

    // TODO: Create tab component, this is annoying. Should be good for all tabs in application
    self.currentTabObs = ko.observable('editor');
    self.isActive = function(tag) {
        return tag === self.currentTabObs();
    };
    self.setTab = function(tabName) {
        return function(vm, event) {
            event.stopPropagation();
            self.currentTabObs(tabName);
        };
    };

    dragula([zonesEl])
        .on('drop', function(el, zone) {
            // This utility handles node lists
            var index = ko.utils.arrayIndexOf(el.parentNode.children, el);
            var data = ko.contextFor(el).$data;
            self.list.removeQuietly(data);
            self.list.insertQuietly(data, index);
        });
};
