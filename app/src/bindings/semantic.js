import ko from "knockout";
import "../../lib/semantic-2.3.min";

var handlers = {
  sidebar: function($element) {
    $element.sidebar();
  },
  accordion: function($element) {
    $element.addClass("ui styled fluid accordion").accordion({ exclusive: false });
  },
  progress: function($element, allBindings, config) {
    $element.addClass("ui tiny progress " + config.state)
      .attr("data-value", config.value)
      .attr("data-total", config.total);
    $element.progress();
  },
  radiobox: function($element, allBindings) {
    var input = $element.children("input[type=checkbox]").get(0);
    input.disabled = !!allBindings().disabled;

    var observer = allBindings().checkboxObs;
    $element.addClass("ui radio checkbox").on("click", function() {
      if (!input.disabled) {
        observer(!observer());
        $element.toggleClass("checked", observer());
      }
    });
  },
  checkbox: function($element, allBindings) {
    var input = $element.children("input[type=checkbox]").get(0);
    input.disabled = !!allBindings().disabled;

    var observer = allBindings().checkboxObs;
    $element.addClass("ui checkbox").on("click", function() {
      if (!input.disabled) {
        observer(!observer());
        $element.toggleClass("checked", observer());
      }
    });
  },
  // TODO: This is not a search control. It's only used in the field_definition.html file.
  search: function($element, allBindings) {
    var source = allBindings().source;
    var observer = allBindings().observer;
    var input = $element.children("input.prompt");
    $element.addClass("ui search").search({
      source: source,
      onSelect: function(object) {
        input.trigger("selectedItem", object);
        observer(object.title);
      }
    });
  },
  // TODO: Does this direct binding of an observer fix anything outside of changing constraints?
  dropdown: function($element, allBindings) {
    var params = allBindings().params || { action: "activate" };
    var dropdownChange = allBindings().dropdownChange;
    if (dropdownChange) {
      params.onChange = function(value, text, $selectedItem) {
        dropdownChange($selectedItem.get(0));
      };
    }
    setTimeout(function() {
      $element.addClass("ui dropdown").dropdown(params);
    }, 0);
  },
  "dropdown-button": function($element) {
    $element
      .addClass("ui tiny scrolling button dropdown")
      .dropdown({ action: "hide", transition: "drop", on: "hover" });
  },
  "dropdown-button-toggle": function($element, allBindings) {
    $element.on("click", function() {
      let cont = allBindings().container;
      if (cont) {
        $element
          .closest(cont)
          .find(".dropdown")
          .dropdown("toggle");
      } else {
        console.error("dropdown-button-toggle does not specify a container selector");
      }
    });
  },
  popup: function($element) {
    $element.popup();
  },
  "multi-search-select": function($element, allBindings) {
    let collectionObs = allBindings().updateSelect;

    $element.addClass("ui selection dropdown").dropdown({
      onAdd: function(value, text, $choice) {
        if (!collectionObs.contains(value)) {
          collectionObs().push(value);
        }
      },
      onRemove: function(value) {
        collectionObs.remove(value);
      }
    });
    // may not need this
    $element.dropdown("set selected", collectionObs());
    collectionObs.subscribe(function(newValue) {
      // Annoyingly, this is needed to initialize the criteria component correctly in the
      // criteria-based schedule editor.
      setTimeout(() => {
        $element.dropdown("set selected", newValue);
      }, 1);
    });
  }
};

ko.bindingHandlers.semantic = {
  init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    var value = ko.unwrap(valueAccessor());
    // If it's an object, it's passed as a third argument and it must have a 'type' property
    // to select the correct semantic control.
    if (typeof value === "object") {
      handlers[value.type]($(element), allBindings, value);
    }
    // Otherwise it's just the name of a semantic control.
    else if (handlers[value]) {
      handlers[value]($(element), allBindings);
    } else {
      throw new Error("Semantic binding not found: " + value);
    }
  }
};
