import BridgeError from "../../bridge_error";
import ko from "knockout";
import utils from "../../utils";

/**
 * params:
 *  item - the item being manipulated.
 *  data - a string that represents JSON data
 *  saveFunc - the function to call on save
 */
export default function(params) {
  let self = this;

  self.dataObs = ko.observable(JSON.stringify(params.data, null, 2));

  self.save = function(vm, event) {
    try {
      let string = self.dataObs();
      if (string === '') {
        params.saveFunc(params.item, null);  
      } else {
        let jsonData = JSON.parse(string);
        params.saveFunc(params.item, jsonData);
      }
    } catch(e) {
      let error = new BridgeError();
      error.addError("clientData", "is not valid JSON");
      utils.failureHandler({ id: 'json-editor', transient: false })(error);
    }
  };
  self.close = params.closeFunc;
};
