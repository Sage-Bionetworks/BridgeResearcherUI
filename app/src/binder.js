import config from "./config";
import ko from "knockout";
import fn from "./functions.js";
import jsonFormatter from "./json_formatter";
import { map } from "bluebird";

function nameInspector(string) {
  let isArray = /\[\]$/.test(string);
  let name = isArray ? string.match(/[^\[]*/)[0] : string;
  return { name: name, observableName: name + "Obs", isArray: isArray };
}
function createObservable(doBinding) {
  return function(name, defaultValue, modelTransform, obsTransform) {
    let info = nameInspector(name);
    // No default because registering one indicates you want an update for a model
    // whether it has a property for the observer or not.
    info.modelTransform = modelTransform;
    info.obsTransform = obsTransform || fn.identity; // not needed for an observer
    info.bind = doBinding;

    let value = typeof defaultValue === "undefined" ? undefined : defaultValue;
    // Don't call the transform for the initial value. We have transforms that
    // require app to be loaded and this is usually too early in the cycle for
    // that to be true. Just init the value you want to see in the world.
    let obs = info.isArray ? ko.observableArray(value) : ko.observable(value);
    this.vm[info.observableName] = info.observable = obs;
    this.fields[info.name] = info;
    return this;
  };
}

export default class Binder {
  constructor(vm) {
    this.vm = vm;
    this.fields = {};
    /**
     * Create an observable on the view model that updates the model object.
     * Update will update the observable, and persist will update the model
     * object.
     *
     * @param name - the name of the property on the model object
     * @param defaultValue - a default value for this field, can null
     * @param modelTransform - a pure function that formats a model value before
     *      setting an observer with the value
     * @param obsTransform - a pure function that formats the value of an
     *      observable before updating a model object
     */
    this.bind = createObservable(true);
    /**
     * Create an observable on the view model that does not update the model object.
     * Update will update the observable, but persist will not update the model
     * object. An observer transform is not needed because the observer will not be
     * used to update a model object.
     *
     * @param name - the name of the property on the model object
     * @param defaultValue - a default value for this field, can null
     * @param modelTransform - a pure function that formats a model value before
     *      setting an observer with the value
     */
    this.obs = createObservable(false);
  }
  /**
   * Returns a function that can be registered as a callback to receive a model and
   * update observables in the view model. If no field names are supplied, all observables
   * that have a name that matches a field of the model will be updated. Before being
   * copied to an observable, the value is passed through the "model transform" function,
   * if one is provided. The transform receives the following arguments:
   *  - value (the value of the observable)
   *  - context - a context with these properties:
   *      - oldValue - the current value of the observable
   *      - model - the whole model object being updated (not the copy being updated!)
   *      - vm - the viewModel
   *      - observer - the observable instance
   */
  update() {
    console.assert(
      arguments.length === 0 || typeof arguments[0] === "string",
      "binder.update() returns function for updating, do not call directly with a model object."
    );
    let fields = arguments.length > 0 ? arguments : Object.keys(this.fields);
    return model => {
      for (let i = 0; i < fields.length; i++) {
        let field = fields[i];
        let info = this.fields[field];
        
        let context = { oldValue: info.observable(), model: model, vm: this.vm, observer: info.observable };
        if (info.modelTransform) {
          let value = info.modelTransform(model[field], context);
          info.observable(value);
        } else if (typeof model[field] !== "undefined") {
          info.observable(model[field]);
        } else {
          // no transform, no defined value, just do nothing. This should obviate
          // the need for fn.maintainValue many places.
        }
      }
      return model;
    };
  }
  /**
   * Persist all the bound observables (two-way data bound) created with bind() back to a
   * copy of the model object, maintaining all the existing properties that are not updated.
   *
   * @param model - the model to serve as a basis for the updated model object. Each value
   * from an observable is passed to the "observer transform" for processing, if it was defined.
   * The transform receives the following arguments:
   *  - value (the value of the observable)
   *  - context - a context with these properties:
   *      - oldValue - the current value on the model
   *      - copy - the whole model object being updated (not the copy being updated!)
   *      - model - the original model object being updated
   *      - vm - the viewModel
   *      - observer - the observer
   */
  persist(model) {
    let copy = Object.assign({}, model);
    Object.keys(this.fields).forEach(field => {
      let info = this.fields[field];
      if (info.bind) {
        let context = { oldValue: model[info.name], model: model, copy: copy, vm: this.vm, observer: info.observable };
        let value = info.obsTransform(info.observable(), context);
        if (value !== null && value !== '' && typeof value !== "undefined") {
          copy[info.name] = value;
        } else {
          delete copy[info.name];
        }
      }
    });
    return copy;
  }
  assign(field) {
    console.assert(typeof field === "string", "string field value must be supplied");
    return model => {
      this.vm[field] = model;
      return model;
    };
  }
  // do not add the binder to JSON serializations
  toJSON() {
    return null;
  }
  /**
   * Retrieve the value of a property on an object that is set as a property on the model
   * (rather than directly as a property of the model);
   */
  static fromObjectField(fieldName, objFieldName) {
    return function(value, context) {
      context.model[fieldName] = context.model[fieldName] || {};
      return context.model[fieldName][objFieldName];
    };
  }
  /**
   * Write the observer to the property of an object that is a property on the model
   * (rather than directly on the model);
   */
  static toObjectField(fieldName, objFieldName) {
    return function(value, context) {
      context.model[fieldName] = context.model[fieldName] || {};
      if (typeof value !== "undefined" && value !== "") {
        context.model[fieldName][objFieldName] = value;
      } else {
        delete context.model[fieldName][objFieldName];
      }
    };
  }
  static objPropDelegates(fieldName, objFieldName) {
    return {
      toObject: Binder.toObjectField(fieldName, objFieldName),
      fromObject: Binder.fromObjectField(fieldName, objFieldName)
    };
  }
  static persistAttributes(value) {
    return value.reduce(function(map, value) {
      map[value.key] = value.obs();
      return map;
    }, {});
  }
  static formatTitle(value, context) {
    let user = context.model;
    if (user.id === "new" && fn.isBlank(user.firstName) && fn.isBlank(user.lastName)) {
      return "New participant";
    }
    return fn.formatName(context.model);
  }
  static formatAttributes(value, context) {
    context.vm.attributesObs().map(function(attr) {
      if (value) {
        attr.obs(value[attr.key]);
      }
    });
    return context.vm.attributesObs();
  }
  static formatHealthCode(value, context) {
    return value ? value : "N/A";
  }
  static callObsCallback(value, context) {
    return context.observer.callback();
  }
  // I've figured out an elegant way to retrieve the data from deeply nested component
  // structures, look at how schedules v2 deal with this. It does require creating a 
  // component for every repeating element in the tree. It's worth it.
  static persistArrayWithBinder(array, context) {
    for (var i=0; i < array.length; i++) {
      let item = array[i];
      if (item.binder) {
        array[i] = item.binder.persist(item);
      }
    }
    return array;
  }
  static fromJson(json, context) {
    if (json) {
      try {
        return jsonFormatter.prettyPrint(json);
      } catch (e) {
        console.error(e);
      }
    }
    return "";
  }
  static toJson(string, context) {
    if (string) {
      try {
        return JSON.parse(string);
      } catch (e) {
        console.error(e);
      }
      return null;
    }
  }
  static emptyToNull(string, context) {
    return fn.isBlank(string) ? null : string;
  }
  static formatExternalIds(object, context) {
    let arr = [];
    if (object) {
      Object.keys(object).forEach(key => {
        arr.push(`${object[key]} (${key})`);
      });
    }
    return (arr.length) ? arr.join(', ') : '—';
  }
  static fromCustomizationFields(object, context) {
    let editorsObs = context.vm.editorsObs;
    editorsObs([]);
    let cf = object || {};
    Object.keys(cf).forEach(fieldIdentifier => {
      for (let i=0; i < cf[fieldIdentifier].length; i++) {
        let props = cf[fieldIdentifier][i];
        props.identifierObs = ko.observable(fieldIdentifier);
        props.propNameObs = ko.observable(props.propName);
        props.labelObs = ko.observable(props.label);
        props.descriptionObs = ko.observable(props.description);
        props.propTypeObs = ko.observable(props.propType);
        props.propTypeOptions = config.assessmentPropTypes;
        editorsObs.push(props);
      }
    });
  }
  static toCustomizationFields(object, context) {
    let editorsObs = context.vm.editorsObs;
    let cf = {};
    for (let i=0; i < editorsObs().length; i++) {
      let editor = editorsObs()[i];
      let id = editor.identifierObs(); 
      if (id) {
        cf[id] = cf[id] || [];
        cf[id].push({
          propName: editor.propNameObs(),
          label: editor.labelObs(),
          description: editor.descriptionObs(),
          propType: editor.propTypeObs()
        });
      }
    }
    return cf;
  }
}
