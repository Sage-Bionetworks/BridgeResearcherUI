import { Binder } from '../../binder';
import { fn } from '../../functions';
import { ko } from 'knockout';
import { root } from '../../root';

/**
 * This is a simpler replacement for the object-hash library.
 * File size: 53k less than including object-hash
 * Performance: 2-3ms to calculate rather than 18-34ms
 * Seems to be unique enough to differentate the lists, calling it good.
 */
function hash(array) {
    if (array === null || array.length === 0) {
        return 0;
    }
    var total = 0, i = array.length;
    while(i--) {
        var object = array[i];
        var label = object.label;
        var detail = object.detail;
        var value = object.value; 
        if (typeof label !== "undefined" && label !== null) {
            total += checksum(label);
        }
        if (typeof detail !== "undefined" && detail !== null) {
            total += checksum(detail);
        }
        if (typeof value !== "undefined" && value !== null) {
            total += checksum(value);
        }
    }
    return total;
}

function checksum(s) {
    var chk = 0x12345678;
    var i = s.length;
    while(i--) {
        chk += (s.charCodeAt(i) * (i + 1));
    }
    return (chk & 0xffffffff).toString(16);
}

function ListsSource(elements, element) {
    this.currentListEntry = null;
    this.listSet = [];
    var md5s = {};
    elements.forEach(function(anElement) {
        var enumeration = getEnumeration(anElement);
        if (enumeration) {
            var entry = makeListMapEntry(enumeration, anElement === element);
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
    this.listSet.sort(fn.makeFieldSorter('name'));
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
};

function makeListMapEntry(enumeration, isSelectedEnumeration) {
    var name = "&lt;empty&gt;";
    if (enumeration.length === 1) {
        name = itemLabel(enumeration[0]);
    } else if (enumeration.length === 2) {
        name = itemLabel(enumeration[0]) + " / " + itemLabel(enumeration[enumeration.length-1]);
    } else if (enumeration.length > 2) {
        name = itemLabel(enumeration[0]) + " to " + itemLabel(enumeration[enumeration.length-1]);
    }
    // tediously, knockout.js fails when there's no detail property
    enumeration.forEach(function(item) {
        item.detail = item.detail || null;
    });
    if (isSelectedEnumeration) {
        enumeration = copyEnum(enumeration);
    }
    return {name: name, md5: hash(enumeration), enumeration: enumeration, occurrences: 1};
}

function copyEnum(enumeration) {
    return enumeration.map(function(item) {
        return {label: item.label, value: item.value, detail: item.detail};
    });
}

function itemLabel(item) {
    return (item.detail) ? ("<b>"+item.label+"</b>&mdash;"+item.detail) : ("<b>"+item.label+"</b>");
}

function copyEntry(element, entry) {
    if (element.constraints.enumerationObs) {
        element.constraints.enumerationObs([].concat(entry.enumeration));
    }

}

function getEnumeration(element) {
    var con = element.constraints;
    if (con && con.enumerationObs) {
        return con.enumerationObs();
    }
    return null;
}
function isValueValidOnServer(value) {
    if (typeof value === "undefined" || value === null || value === "") {
        return false;
    }
    if (value.length === 1) {
        return /^[a-zA-Z0-9]+$/.test(value);
    }
    // alphanumerics with space/dash/underscore/period allowed in middle, but never in a sequence of two or more.
    return /^[a-zA-Z0-9][a-zA-Z0-9-._\s]*[a-zA-Z0-9]$/.test(value) && !/[-._\s]{2,}/.test(value);
}

module.exports = function(params) {
    var self = this;

    var parent = params.parentViewModel;
    fn.copyProps(self, parent, 'elementsObs', 'element');

    var listsSource = new ListsSource(self.elementsObs(), self.element);

    new Binder(self)
        .obs('label')
        .obs('detail')
        .obs('value')
        .obs('index', null)
        .obs('currentTab', 'editor')
        .obs('selectedIndex', 0)
        .obs('copyToAllEnums', true)
        .obs('allLists[]', listsSource.getAllLists())
        .obs('list[]', listsSource.getCurrentEntry().enumeration);

    self.hasDetail = function(item) {
        return !!item.detail;
    };
    self.removeListItem = function(item) {
        self.listObs.remove(item);
    };
    self.selectList = function(entry, event) {
        self.listObs(entry.enumeration);
        listsSource.setCurrentEntry(entry);
        self.currentTabObs('editor');
    };
    self.handleKeyEvent = function(vm, event) {
        if (event.keyCode === 13) {
            self.addListItem();
            return false;
        }
        return true;
    };
    self.moveToEditor = function(item, event) {
        var index = self.listObs().indexOf(item);
        self.indexObs(index);
        self.labelObs(item.label);
        self.detailObs(item.detail);
        self.valueObs(item.value);
    };
    self.editorTitleObs = ko.computed(function() {
        return (self.indexObs() !== null) ? 'Edit List Item' : 'Add New List Item';
    });
    self.editorCommandObs = ko.computed(function() {
        return (self.indexObs() !== null) ? 'Update' : 'Add';
    });
    self.newListItemValid = ko.computed(function() {
        var value = self.valueObs() || self.labelObs();
        return !isValueValidOnServer(value);
    });
    self.cancelEditMode = function() {
        self.labelObs("");
        self.detailObs("");
        self.valueObs("");
        self.indexObs(null);
    };
    self.selectedIndexObs.subscribe(self.cancelEditMode);

    self.addListItem = function() {
        var label = self.labelObs();
        if (label) {
            var value = self.valueObs() || label;
            if (self.indexObs() !== null) {
                var item = self.listObs()[self.indexObs()];
                item.label = self.labelObs();
                item.value = value;
                item.detail = self.detailObs();
                self.listObs.splice(self.indexObs(),1);
                self.listObs.splice(self.indexObs(),0,item);
            } else {
                self.listObs.push({label: label, value: value, detail: self.detailObs()});
            }
        }
        self.cancelEditMode();
    };
    self.saveList = function() {
        var entry = listsSource.getCurrentEntry();

        entry.enumeration = self.listObs();

        // We're looking for lists on other elements that were similar to the list before
        // the user started editing it, so we want the original MD5 before it gets
        // recalculated
        var oldMD5 = entry.md5;

        copyEntry(self.element, entry);
        if (self.copyToAllEnumsObs()) {
            self.elementsObs().forEach(function (element) {
                var enumeration = getEnumeration(element);
                if (enumeration && hash(enumeration) === oldMD5) {
                    copyEntry(element, entry);
                }
            });
        }
        self.cancelEditMode();
        root.closeDialog();
    };
    self.isActive = function(tag) {
        self.cancelEditMode();
        return tag === self.currentTabObs();
    };
    self.setTab = function(tabName) {
        return function(vm, event) {
            event.stopPropagation();
            self.currentTabObs(tabName);
        };
    };
    // Should we copy edits over to all the same lists.
    self.cancel = fn.seq(self.cancelEditMode, root.closeDialog);
};
module.exports.prototype.dispose = function() {
    this.editorTitleObs.dispose();
    this.editorCommandObs.dispose();
    this.newListItemValid.dispose();
};