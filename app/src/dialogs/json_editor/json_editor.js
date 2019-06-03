import ko from "knockout";

/**
 * params:
 *  item - the item being manipulated.
 *  data - a string that represents JSON data
 *  saveFunc - the function to call on save
 */
export default function(params) {
  let self = this;

  self.dataObs = ko.observable(JSON.stringify(params.data));

  self.save = function(vm, event) {
    let string = self.dataObs();
    let jsonData = JSON.parse(string);
    params.saveFunc(params.item, jsonData);
  };
  self.close = params.closeFunc;
};
